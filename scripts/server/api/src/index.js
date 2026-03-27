'use strict';
require('dotenv').config({ path: '/etc/oarn/.env' });
require('dotenv').config({ path: '/etc/oarn/db.env' });

const express     = require('express');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const { ethers }  = require('ethers');
const { createClient } = require('redis');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── RPC provider ────────────────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
);

// ─── Contract ABIs ───────────────────────────────────────────────────────────
const TASK_REGISTRY_ABI = [
  'function getTask(uint256 taskId) view returns (tuple(bytes32 modelHash, bytes32 inputHash, address submitter, uint256 rewardPerNode, uint256 requiredNodes, uint256 deadline, uint8 status, uint8 consensusType, string modelRequirements))',
  'function taskCount() view returns (uint256)',
  'event TaskCreated(uint256 indexed taskId, address indexed submitter, bytes32 modelHash)',
  'event ConsensusReached(uint256 indexed taskId, bytes32 resultHash)',
  'event RewardDistributed(uint256 indexed taskId, address indexed node, uint256 amount, bool matchedConsensus)',
];

const REGISTRY_ABI = [
  'function getNodeCount() view returns (uint256)',
  'function getNodes(uint256 offset, uint256 limit) view returns (address[])',
];

const taskRegistry = new ethers.Contract(
  process.env.TASK_REGISTRY || '0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0',
  TASK_REGISTRY_ABI,
  provider
);

const oarnRegistry = new ethers.Contract(
  process.env.OARN_REGISTRY || '0x8DD738DBBD4A8484872F84192D011De766Ba5458',
  REGISTRY_ABI,
  provider
);

// ─── Redis cache ─────────────────────────────────────────────────────────────
let redis = null;
(async () => {
  if (process.env.REDIS_URL) {
    redis = createClient({ url: process.env.REDIS_URL });
    redis.on('error', err => console.error('Redis error:', err.message));
    await redis.connect();
    console.log('Redis connected');
  }
})();

async function cached(key, ttlSeconds, fn) {
  if (redis) {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);
    const val = await fn();
    await redis.set(key, JSON.stringify(val), { EX: ttlSeconds });
    return val;
  }
  return fn();
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(express.json());
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'https://oarn-dashboard.vercel.app',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST'],
}));
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
}));

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Network stats
app.get('/stats', async (req, res) => {
  try {
    const stats = await cached('stats:network', 60, async () => {
      const [taskCount, nodeCount] = await Promise.all([
        taskRegistry.taskCount().catch(() => 0n),
        oarnRegistry.getNodeCount().catch(() => 0n),
      ]);
      return {
        taskCount: taskCount.toString(),
        nodeCount: nodeCount.toString(),
        updatedAt: Date.now(),
      };
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Task list (latest N tasks)
app.get('/tasks', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20'), 100);
    const tasks = await cached(`tasks:latest:${limit}`, 30, async () => {
      const count = Number(await taskRegistry.taskCount().catch(() => 0n));
      if (count === 0) return [];
      const from  = Math.max(0, count - limit);
      const ids   = Array.from({ length: count - from }, (_, i) => from + i);
      const list  = await Promise.all(ids.map(id => taskRegistry.getTask(id)
        .then(t => ({
          id,
          modelHash:    t.modelHash,
          submitter:    t.submitter,
          rewardPerNode: ethers.formatEther(t.rewardPerNode),
          requiredNodes: Number(t.requiredNodes),
          deadline:     Number(t.deadline),
          status:       Number(t.status),
          consensusType: Number(t.consensusType),
        }))
        .catch(() => null)
      ));
      return list.filter(Boolean).reverse();
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single task
app.get('/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid task ID' });
    const task = await cached(`task:${id}`, 10, async () => {
      const t = await taskRegistry.getTask(id);
      return {
        id,
        modelHash:     t.modelHash,
        inputHash:     t.inputHash,
        submitter:     t.submitter,
        rewardPerNode: ethers.formatEther(t.rewardPerNode),
        requiredNodes: Number(t.requiredNodes),
        deadline:      Number(t.deadline),
        status:        Number(t.status),
        consensusType: Number(t.consensusType),
        modelRequirements: t.modelRequirements,
      };
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Node list
app.get('/nodes', async (req, res) => {
  try {
    const nodes = await cached('nodes:list', 120, async () => {
      const count = Number(await oarnRegistry.getNodeCount().catch(() => 0n));
      if (count === 0) return [];
      const addrs = await oarnRegistry.getNodes(0, Math.min(count, 200));
      return Array.from(addrs);
    });
    res.json({ count: nodes.length, nodes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Node info + balance
app.get('/nodes/:address', async (req, res) => {
  try {
    const addr = req.params.address;
    if (!ethers.isAddress(addr)) return res.status(400).json({ error: 'Invalid address' });
    const info = await cached(`node:${addr.toLowerCase()}`, 15, async () => {
      const balance = await provider.getBalance(addr);
      return {
        address: addr,
        balance: ethers.formatEther(balance),
        updatedAt: Date.now(),
      };
    });
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`OARN API gateway listening on 127.0.0.1:${PORT}`);
});
