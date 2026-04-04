#!/usr/bin/env node
/**
 * benchmark-loop.js — Continuously submit ML inference tasks to OARN testnet.
 *
 * Reads model-registry.json, generates random inputs, submits tasks to
 * TaskRegistryV2 on Arbitrum Sepolia, and logs results.
 *
 * Usage:
 *   BENCHMARK_PRIVATE_KEY=0x... node scripts/benchmark/benchmark-loop.js
 *   BENCHMARK_PRIVATE_KEY=0x... TASKS_PER_RUN=5 node scripts/benchmark/benchmark-loop.js
 *
 * Required env vars:
 *   BENCHMARK_PRIVATE_KEY   — wallet private key (funded with Sepolia ETH)
 *
 * Optional env vars:
 *   RPC_URL                 — Arbitrum Sepolia RPC (default: public endpoint)
 *   TASKS_PER_RUN           — tasks to submit per execution (default: 3)
 *   REWARD_PER_NODE_ETH     — ETH reward per node per task (default: 0.0001)
 *   REQUIRED_NODES          — consensus nodes required (default: 2)
 *   DEADLINE_HOURS          — task deadline in hours (default: 2)
 */

const { ethers } = require("ethers");
const crypto = require("crypto");
const fs     = require("fs");
const path   = require("path");

// ─── Config ─────────────────────────────────────────────────────────────────

const RPC_URL           = process.env.RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const PRIVATE_KEY       = process.env.BENCHMARK_PRIVATE_KEY;
const TASKS_PER_RUN     = parseInt(process.env.TASKS_PER_RUN     || "3");
const REWARD_ETH        = process.env.REWARD_PER_NODE_ETH        || "0.0001";
const REQUIRED_NODES    = parseInt(process.env.REQUIRED_NODES    || "2");
const DEADLINE_HOURS    = parseInt(process.env.DEADLINE_HOURS    || "2");
const CONTRACT_ADDRESS  = "0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0";
const REGISTRY_PATH     = path.join(__dirname, "model-registry.json");
const LOG_PATH          = path.join(__dirname, "run.log");

if (!PRIVATE_KEY) {
  console.error("Error: BENCHMARK_PRIVATE_KEY env var required");
  process.exit(1);
}

// ─── Contract ABI (submitTask only) ─────────────────────────────────────────

const ABI = [
  "function submitTask(bytes32 modelHash, bytes32 inputHash, string modelRequirements, uint256 rewardPerNode, uint256 requiredNodes, uint256 deadline, uint8 consensusType) payable returns (uint256)",
  "event TaskCreated(uint256 indexed taskId, address indexed submitter, bytes32 modelHash)",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert IPFS CID to bytes32 (raw SHA-256 multihash digest).
 * Mirrors cidToBytes32() in oarn-sdk/src/utils.ts.
 */
function cidToBytes32(cidStr) {
  // Handles both CIDv0 (Qm... base58) and CIDv1 (b... base32).
  // Both encode a SHA-256 multihash: [0x12][0x20][32-byte digest].
  // We extract just the 32-byte digest as a bytes32 value.

  if (cidStr.startsWith("Qm") || cidStr.startsWith("1")) {
    // CIDv0 — base58-encoded multihash (no version/codec prefix)
    // Multihash layout: [0x12 hashfn][0x20 digestlen][32 bytes digest]
    const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let num = BigInt(0);
    for (const c of cidStr) {
      const digit = BASE58.indexOf(c);
      if (digit === -1) throw new Error(`cidToBytes32: invalid base58 char '${c}' in CID ${cidStr}`);
      num = num * BigInt(58) + BigInt(digit);
    }
    // Convert BigInt to 34-byte buffer (2 multihash header bytes + 32 digest bytes)
    const hex = num.toString(16).padStart(68, "0"); // 34 bytes = 68 hex chars
    const digest = hex.slice(4); // skip 0x12 + 0x20 (2 bytes = 4 hex chars)
    if (digest.length !== 64) {
      throw new Error(`cidToBytes32: expected 32-byte digest, got ${digest.length / 2} from CID ${cidStr}`);
    }
    return "0x" + digest;
  }

  // CIDv1 base32: "b" multibase prefix + base32-encoded [version][codec][multihash]
  const base32Chars = "abcdefghijklmnopqrstuvwxyz234567";
  let cidBody = cidStr.toLowerCase();
  if (cidBody.startsWith("b")) cidBody = cidBody.slice(1);

  let bits = 0, bitsCount = 0;
  const bytes = [];
  for (const c of cidBody) {
    const val = base32Chars.indexOf(c);
    if (val === -1) continue;
    bits = (bits << 5) | val;
    bitsCount += 5;
    if (bitsCount >= 8) {
      bitsCount -= 8;
      bytes.push((bits >> bitsCount) & 0xff);
    }
  }

  // Skip version varint, codec varint, then hashfn + digestlen (2 bytes)
  let offset = 0;
  while (bytes[offset] & 0x80) offset++;
  offset++;
  while (bytes[offset] & 0x80) offset++;
  offset++;
  offset += 2;

  const digest = bytes.slice(offset, offset + 32);
  if (digest.length !== 32) {
    throw new Error(`cidToBytes32: expected 32-byte digest, got ${digest.length} from CID ${cidStr}`);
  }
  return "0x" + Buffer.from(digest).toString("hex");
}

/**
 * Generate a random float array of given size and return
 * { inputJson, inputHash }
 */
function makeInput(inputSize) {
  const values = Array.from({ length: inputSize }, () =>
    parseFloat((Math.random() * 2 - 1).toFixed(4))
  );
  const inputJson = JSON.stringify({ input: values, shape: [1, inputSize] });
  const inputHash = "0x" + crypto.createHash("sha256")
    .update(inputJson, "utf8")
    .digest("hex");
  return { inputJson, inputHash };
}

function now() {
  return new Date().toISOString();
}

function appendLog(line) {
  const entry = `[${now()}] ${line}\n`;
  process.stdout.write(entry);
  fs.appendFileSync(LOG_PATH, entry);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Load registry
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`Error: model-registry.json not found at ${REGISTRY_PATH}`);
    console.error("Run: node scripts/benchmark/setup.js");
    process.exit(1);
  }
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  if (!registry.models || registry.models.length === 0) {
    console.error("Error: model-registry.json has no models. Run setup.js first.");
    process.exit(1);
  }

  appendLog(`=== Benchmark run start — ${TASKS_PER_RUN} tasks ===`);

  // Connect
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  const balance = await provider.getBalance(wallet.address);
  appendLog(`Wallet: ${wallet.address} — Balance: ${ethers.formatEther(balance)} ETH`);

  const rewardPerNode = ethers.parseEther(REWARD_ETH);
  const deadline      = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_HOURS * 3600);
  const consensusType = 0; // 0 = HashConsensus
  const totalPayment  = rewardPerNode * BigInt(REQUIRED_NODES);

  const submitted = [];
  let failures    = 0;

  for (let i = 0; i < TASKS_PER_RUN; i++) {
    // Pick model round-robin
    const model = registry.models[i % registry.models.length];
    const modelHash = cidToBytes32(model.cid);
    const { inputJson, inputHash } = makeInput(model.inputSize);

    try {
      appendLog(`  [${i + 1}/${TASKS_PER_RUN}] Submitting task: ${model.label} (${model.inputSize} inputs)`);

      const tx = await contract.submitTask(
        modelHash,
        inputHash,
        model.requirements,
        rewardPerNode,
        BigInt(REQUIRED_NODES),
        deadline,
        consensusType,
        { value: totalPayment }
      );

      appendLog(`    tx: ${tx.hash} — waiting for confirmation...`);
      const receipt = await tx.wait();

      // Parse TaskCreated event to get taskId
      const iface = new ethers.Interface(ABI);
      let taskId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed.name === "TaskCreated") {
            taskId = parsed.args.taskId.toString();
          }
        } catch (_) {}
      }

      appendLog(`    ✓ Task #${taskId ?? "?"} created — block ${receipt.blockNumber}`);
      submitted.push({ taskId, model: model.label, txHash: tx.hash, inputJson });

    } catch (err) {
      appendLog(`    ✗ Failed: ${err.message.split("\n")[0]}`);
      failures++;
    }

    // Small delay between submissions to avoid nonce collisions
    if (i < TASKS_PER_RUN - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  appendLog(`=== Run complete — ${submitted.length} submitted, ${failures} failed ===`);

  // Write a compact summary for CI logs
  const summaryPath = path.join(__dirname, "last-run-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: now(),
    submitted: submitted.length,
    failures,
    tasks: submitted.map(t => ({ taskId: t.taskId, model: t.model, txHash: t.txHash })),
  }, null, 2) + "\n");
}

main().catch(err => {
  appendLog(`FATAL: ${err.message}`);
  process.exit(1);
});
