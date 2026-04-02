/**
 * task-watcher.mjs
 *
 * Checks TaskRegistryV2 for new TaskCreated events since the last run.
 * Posts a Discord alert for each new task found.
 * State (last checked block) is stored in leaderboard/.last-watched-block.
 *
 * Usage:
 *   DISCORD_WEBHOOK=https://... node scripts/task-watcher.mjs
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RPC_URL        = process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const WEBHOOK        = process.env.DISCORD_WEBHOOK;
const CONTRACT       = '0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0';
const STATE_FILE     = path.join(__dirname, '..', 'leaderboard', '.last-watched-block');
const DASHBOARD_URL  = 'https://oarn-dashboard.vercel.app';

// Minimal ABI — only what we need
const ABI = [
  'event TaskCreated(uint256 indexed taskId, address indexed requester, bytes32 modelHash, uint256 rewardPerNode, uint256 requiredNodes, uint8 consensusType)',
  'function tasks(uint256 taskId) view returns (address requester, bytes32 modelHash, bytes32 inputHash, uint256 rewardPerNode, uint256 requiredNodes, uint256 deadline, uint8 status, uint8 consensusType)',
];

const CONSENSUS_LABELS = { 0: 'Majority (>50%)', 1: 'SuperMajority (>66%)', 2: 'Unanimous (100%)' };

function formatEth(wei) {
  return (Number(wei) / 1e18).toFixed(4);
}

function readLastBlock() {
  try { return parseInt(fs.readFileSync(STATE_FILE, 'utf8').trim()) || 0; }
  catch { return 0; }
}

function saveLastBlock(block) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, String(block));
}

async function postDiscord(message) {
  if (!WEBHOOK) { console.log('[Discord] No webhook set — skipping'); return; }
  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  });
  if (!res.ok) console.error(`Discord post failed: ${res.status}`);
}

async function main() {
  console.log(`[${new Date().toISOString()}] OARN Task Watcher starting...`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT, ABI, provider);
  const iface = new ethers.Interface(ABI);

  const latestBlock = await provider.getBlockNumber();
  const lastChecked = readLastBlock();

  // On first run, start from 24h ago (~43200 blocks at ~2s/block on Arbitrum)
  const fromBlock = lastChecked > 0 ? lastChecked + 1 : Math.max(0, latestBlock - 43200);

  console.log(`Checking blocks ${fromBlock} → ${latestBlock}`);

  const topic = iface.getEvent('TaskCreated').topicHash;
  const logs = await provider.getLogs({
    address: CONTRACT,
    topics: [topic],
    fromBlock,
    toBlock: latestBlock,
  });

  console.log(`Found ${logs.length} new TaskCreated event(s)`);

  let posted = 0;
  for (const log of logs) {
    const parsed = iface.parseLog(log);
    const taskId       = Number(parsed.args.taskId);
    const requester    = parsed.args.requester;
    const rewardPerNode = parsed.args.rewardPerNode;
    const requiredNodes = Number(parsed.args.requiredNodes);
    const consensusType = Number(parsed.args.consensusType);

    // Fetch full task details for deadline
    let deadlineStr = 'unknown';
    try {
      const task = await contract.tasks(taskId);
      const deadline = new Date(Number(task.deadline) * 1000);
      const hoursLeft = Math.round((deadline - Date.now()) / 3600000);
      deadlineStr = hoursLeft > 0 ? `${hoursLeft}h remaining` : 'expired';
    } catch { /* non-fatal */ }

    const message = [
      `🆕 **New Task on Testnet — Task #${taskId}**`,
      '',
      `👥 Nodes needed: **${requiredNodes}**  |  💰 Reward: **${formatEth(rewardPerNode)} ETH/node**`,
      `⚖️ Consensus: **${CONSENSUS_LABELS[consensusType] || consensusType}**`,
      `⏰ Deadline: ${deadlineStr}`,
      `📍 Requester: \`${requester.slice(0, 10)}...${requester.slice(-6)}\``,
      '',
      `Claim it → <${DASHBOARD_URL}>`,
    ].join('\n');

    console.log(`Posting alert for Task #${taskId}...`);
    await postDiscord(message);
    posted++;

    // Small delay between posts to avoid Discord rate limiting
    if (logs.length > 1) await new Promise(r => setTimeout(r, 1500));
  }

  saveLastBlock(latestBlock);
  console.log(`Done. Posted ${posted} alert(s). Last block saved: ${latestBlock}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
