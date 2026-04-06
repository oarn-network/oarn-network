/**
 * OARN Continuous Task Submitter
 *
 * Keeps TaskRegistryV2 populated with open tasks so node operators
 * always have work to claim. Submits tasks using real IPFS-pinned
 * ONNX models from model-registry.json with properly-shaped inputs.
 *
 * Run via GitHub Actions schedule or manually.
 *
 * Usage:
 *   SUBMITTER_PRIVATE_KEY=0x... node scripts/task-submitter.mjs
 *
 * Env vars:
 *   SUBMITTER_PRIVATE_KEY  - Wallet private key (required)
 *   RPC_URL                - Arbitrum Sepolia RPC (optional, has default)
 *   MIN_OPEN_TASKS         - Minimum open tasks to maintain (default: 3)
 *   DRY_RUN                - Set to "true" to simulate without submitting
 *   DISCORD_WEBHOOK        - Discord webhook URL for notifications (optional)
 */

import { ethers } from 'ethers';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Contract config ───────────────────────────────────────────────────────────
const TASK_REGISTRY_ADDRESS = '0x10ffe4d0491112d92Fe7BE4c9Eabe486DC221159';
const IPFS_API_URL          = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';

const TASK_REGISTRY_READ_ABI = [
  'function taskCount() view returns (uint256)',
  'function tasks(uint256 taskId) view returns (uint256 id, address requester, bytes32 modelHash, bytes32 inputHash, string modelRequirements, uint256 rewardPerNode, uint256 requiredNodes, uint256 claimedCount, uint256 submittedCount, uint256 deadline, uint8 status, uint8 consensusType, uint256 createdAt, bytes32 consensusResult)',
];
const TASK_REGISTRY_WRITE_ABI = [
  'function submitTask(bytes32 modelHash, bytes32 inputHash, string modelRequirements, uint256 rewardPerNode, uint256 requiredNodes, uint256 deadline, uint8 consensusType) payable returns (uint256)',
  'event TaskCreated(uint256 indexed taskId, address indexed requester, bytes32 modelHash, uint256 rewardPerNode, uint256 requiredNodes, uint8 consensusType)',
];

// ── Config ────────────────────────────────────────────────────────────────────
const PRIVATE_KEY     = process.env.SUBMITTER_PRIVATE_KEY;
const RPC_URL         = process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const MIN_OPEN_TASKS  = parseInt(process.env.MIN_OPEN_TASKS || '3', 10);
const MAX_SUBMIT      = 3;
const CHECK_LAST_N    = 30;
const DEADLINE_HOURS  = 48;
const REQUIRED_NODES  = 3;     // minimum for consensus; all 3+ fleet nodes will compete to claim
const REWARD_ETH      = '0.001'; // meets minRewardPerNode on TaskRegistryV2
const DRY_RUN         = process.env.DRY_RUN === 'true';
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || null;

// ── Real ONNX models pinned on IPFS ──────────────────────────────────────────
// These are the 3 models uploaded during task #106 (benchmark setup).
// CIDs are stable — models are pinned on the server's IPFS node.
const REGISTRY_PATH = path.join(__dirname, 'benchmark', 'model-registry.json');

// Task descriptions paired to each model for research context
const TASK_DESCRIPTIONS = {
  iris_classifier: [
    { name: 'Protein Class Prediction — parameter sweep A', category: 'structural-biology' },
    { name: 'Protein Class Prediction — parameter sweep B', category: 'structural-biology' },
    { name: 'Biomarker Classification — sample batch A',    category: 'genomics' },
  ],
  linear_regression: [
    { name: 'Enzyme Kinetics Regression — substrate sweep', category: 'biochemistry' },
    { name: 'Drug Binding Affinity Estimation — batch A',   category: 'computational-chemistry' },
    { name: 'Metabolic Flux Prediction — growth conditions', category: 'systems-biology' },
  ],
  mnist_mini: [
    { name: 'Gel Electrophoresis Band Classifier — run A',  category: 'molecular-biology' },
    { name: 'Microscopy Image Feature Extraction — batch A', category: 'cell-biology' },
    { name: 'Spectrogram Pattern Recognition — sweep A',    category: 'analytical-chemistry' },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function formatEth(wei) {
  return (Number(wei) / 1e18).toFixed(6);
}

/**
 * Convert IPFS CIDv0 (Qm...) to bytes32 (raw SHA-256 multihash digest).
 * Mirrors cidToBytes32() in oarn-sdk and benchmark-loop.js.
 */
function cidToBytes32(cidStr) {
  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt(0);
  for (const c of cidStr) {
    const digit = BASE58.indexOf(c);
    if (digit === -1) throw new Error(`cidToBytes32: invalid base58 char '${c}'`);
    num = num * BigInt(58) + BigInt(digit);
  }
  const hex = num.toString(16).padStart(68, '0');
  const digest = hex.slice(4); // skip 0x12 + 0x20 multihash header
  if (digest.length !== 64) throw new Error(`cidToBytes32: bad digest length from ${cidStr}`);
  return '0x' + digest;
}

/**
 * Generate a random float array shaped for the model and return
 * { inputJson, inputBytes } ready for IPFS upload.
 */
function makeInput(model) {
  const size = model.inputSize;
  const values = Array.from({ length: size }, () =>
    parseFloat((Math.random() * 2 - 1).toFixed(4))
  );
  const inputJson = JSON.stringify({
    input: values,
    shape: model.inputShape,
    model: model.label,
    generated_at: new Date().toISOString(),
  });
  return inputJson;
}

/**
 * Upload data to local IPFS and return CIDv0.
 */
async function ipfsAdd(content) {
  const boundary = '---oarntaskboundary';
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="data"',
    'Content-Type: application/octet-stream',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');

  const res = await fetch(`${IPFS_API_URL}/api/v0/add?pin=true`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });

  if (!res.ok) throw new Error(`IPFS add failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.Hash; // CIDv0
}

async function countOpenTasks(provider) {
  const contract = new ethers.Contract(TASK_REGISTRY_ADDRESS, TASK_REGISTRY_READ_ABI, provider);
  const total = Number(await contract.taskCount());
  if (total === 0) return 0;

  const now = Math.floor(Date.now() / 1000);
  const startId = Math.max(1, total - CHECK_LAST_N + 1);
  let open = 0;

  for (let id = startId; id <= total; id++) {
    try {
      const task = await contract.tasks(id);
      const status = Number(task.status);
      const deadline = Number(task.deadline);
      if ((status === 0 || status === 1) && deadline > now) open++;
    } catch { /* skip */ }
  }
  return open;
}

async function notifyDiscord(message) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
  } catch {
    log('Discord notification failed (non-fatal)');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log('OARN Task Submitter starting...');
  log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  log(`Min open tasks: ${MIN_OPEN_TASKS}`);

  if (!PRIVATE_KEY && !DRY_RUN) {
    console.error('Error: SUBMITTER_PRIVATE_KEY env var is required');
    process.exit(1);
  }

  // Load real model registry
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`Error: model-registry.json not found at ${REGISTRY_PATH}`);
    console.error('Run: node scripts/benchmark/setup.js');
    process.exit(1);
  }
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  if (!registry.models?.length) {
    console.error('Error: model-registry.json has no models');
    process.exit(1);
  }
  log(`Loaded ${registry.models.length} real ONNX models from registry`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = DRY_RUN ? null : new ethers.Wallet(PRIVATE_KEY, provider);

  if (!DRY_RUN) {
    const balance = await provider.getBalance(signer.address);
    log(`Wallet: ${signer.address}`);
    log(`ETH balance: ${ethers.formatEther(balance)} ETH`);

    const costPerTask = ethers.parseEther(REWARD_ETH) * BigInt(REQUIRED_NODES);
    if (balance < costPerTask) {
      console.error(`Error: balance ${ethers.formatEther(balance)} ETH is below cost of one task (${ethers.formatEther(costPerTask)} ETH). Fund wallet and retry.`);
      process.exit(1);
    }
    if (balance < costPerTask * BigInt(MAX_SUBMIT)) {
      log(`Warning: balance only covers ${Number(balance / costPerTask)} task(s) (wanted ${MAX_SUBMIT})`);
    }
  }

  const registryContract = new ethers.Contract(TASK_REGISTRY_ADDRESS, TASK_REGISTRY_READ_ABI, provider);
  const total = Number(await registryContract.taskCount());
  log(`Total tasks on-chain: ${total}`);

  const openCount = await countOpenTasks(provider);
  log(`Open (claimable) tasks: ${openCount}`);

  if (openCount >= MIN_OPEN_TASKS) {
    log(`Queue healthy (${openCount} >= ${MIN_OPEN_TASKS}). Nothing to submit.`);
    return;
  }

  const toSubmit = Math.min(MIN_OPEN_TASKS - openCount, MAX_SUBMIT);
  log(`Submitting ${toSubmit} new task(s) with real ONNX models...`);

  const deadline  = Math.floor(Date.now() / 1000) + DEADLINE_HOURS * 3600;
  const reward    = ethers.parseEther(REWARD_ETH);
  const totalCost = reward * BigInt(REQUIRED_NODES);
  const submitted = [];

  for (let i = 0; i < toSubmit; i++) {
    // Cycle through models round-robin
    const model = registry.models[(total + i) % registry.models.length];
    const descriptions = TASK_DESCRIPTIONS[model.label] || [
      { name: `${model.description} — run ${i + 1}`, category: 'general' },
    ];
    const desc = descriptions[(total + i) % descriptions.length];

    log(`[${i + 1}/${toSubmit}] ${desc.name}`);
    log(`  Model: ${model.label} (CID: ${model.cid})`);
    log(`  Input size: ${model.inputSize} floats | Nodes: ${REQUIRED_NODES} | Reward: ${REWARD_ETH} ETH/node`);

    if (DRY_RUN) {
      log('  [DRY RUN] skipping submission');
      submitted.push({ name: desc.name, taskId: 'dry-run' });
      continue;
    }

    try {
      // modelHash — from pre-pinned ONNX CID (nodes can fetch and run this)
      const modelHash = cidToBytes32(model.cid);

      // inputHash — upload fresh random inputs shaped for this model
      const inputJson = makeInput(model);
      log(`  Uploading inputs to IPFS...`);
      const inputCid  = await ipfsAdd(inputJson);
      const inputHash = cidToBytes32(inputCid);
      log(`  Input CID: ${inputCid}`);

      // Submit
      const contract = new ethers.Contract(TASK_REGISTRY_ADDRESS, TASK_REGISTRY_WRITE_ABI, signer);
      const tx = await contract.submitTask(
        modelHash,
        inputHash,
        desc.name,         // stored in calldata for dashboard display
        reward,
        BigInt(REQUIRED_NODES),
        BigInt(deadline),
        0,                 // ConsensusType.Majority
        { value: totalCost }
      );
      const receipt = await tx.wait();

      const iface = new ethers.Interface(TASK_REGISTRY_WRITE_ABI);
      let taskId = '?';
      for (const l of receipt.logs) {
        try {
          const parsed = iface.parseLog(l);
          if (parsed?.name === 'TaskCreated') { taskId = parsed.args.taskId.toString(); break; }
        } catch { /* skip */ }
      }

      log(`  Task ID: ${taskId}  tx: ${tx.hash}`);
      submitted.push({ name: desc.name, taskId, model: model.label });
    } catch (err) {
      log(`  ERROR: ${err.message?.split('\n')[0]}`);
    }
  }

  log('');
  log(`Done. Submitted ${submitted.length} task(s).`);
  submitted.forEach(t => log(`  - ${t.name} → Task #${t.taskId} (${t.model})`));

  if (submitted.length > 0 && !DRY_RUN) {
    const lines = submitted.map(t => `• **${t.name}** → Task #${t.taskId}`).join('\n');
    await notifyDiscord(
      `**${submitted.length} new task(s) posted to testnet**\n${lines}\n\nClaim them → https://oarn-dashboard.vercel.app`
    );
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
