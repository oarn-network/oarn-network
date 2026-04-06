/**
 * OARN 10-Node Stress Test
 *
 * Submits 20 tasks to TaskRegistryV2, each requiring 10 nodes for consensus.
 * Used to validate that the full 10-node fleet is operational (task #57).
 *
 * Usage:
 *   BENCHMARK_PRIVATE_KEY=0x... node scripts/stress-test.mjs
 *
 * Optional env vars:
 *   RPC_URL        - Arbitrum Sepolia RPC (default: public endpoint)
 *   TASKS_TO_SUBMIT - number of tasks to submit (default: 20)
 *   REQUIRED_NODES  - nodes required per task (default: 10)
 *   REWARD_ETH      - reward per node in ETH (default: 0.0001)
 *   DEADLINE_HOURS  - task deadline in hours (default: 4)
 *   DRY_RUN         - set to "true" to simulate without submitting
 */

import { ethers } from 'ethers';
import crypto from 'crypto';

// ── Config ────────────────────────────────────────────────────────────────────
const PRIVATE_KEY      = process.env.BENCHMARK_PRIVATE_KEY;
const RPC_URL          = process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const TASKS_TO_SUBMIT  = parseInt(process.env.TASKS_TO_SUBMIT || '20', 10);
const REQUIRED_NODES   = parseInt(process.env.REQUIRED_NODES  || '10', 10);
const REWARD_ETH       = process.env.REWARD_ETH || '0.0001';
const DEADLINE_HOURS   = parseInt(process.env.DEADLINE_HOURS  || '4',  10);
const DRY_RUN          = process.env.DRY_RUN === 'true';

const CONTRACT_ADDRESS = '0x10ffe4d0491112d92Fe7BE4c9Eabe486DC221159';
const ABI = [
  'function submitTask(bytes32 modelHash, bytes32 inputHash, string modelRequirements, uint256 rewardPerNode, uint256 requiredNodes, uint256 deadline, uint8 consensusType) payable returns (uint256)',
  'event TaskCreated(uint256 indexed taskId, address indexed requester, bytes32 modelHash, uint256 rewardPerNode, uint256 requiredNodes, uint8 consensusType)',
];

// ConsensusType.Majority = 0
const CONSENSUS_MAJORITY = 0;

// ── Validation ────────────────────────────────────────────────────────────────
if (!PRIVATE_KEY && !DRY_RUN) {
  console.error('ERROR: BENCHMARK_PRIVATE_KEY env var required (or set DRY_RUN=true)');
  process.exit(1);
}

// ── Task descriptors ──────────────────────────────────────────────────────────
// 20 distinct scientific inference tasks for the stress test
const STRESS_TASKS = [
  { name: 'Protein Folding — temp sweep A',       category: 'structural-biology'         },
  { name: 'Protein Folding — temp sweep B',       category: 'structural-biology'         },
  { name: 'Enzyme Kinetics — substrate screen A', category: 'biochemistry'               },
  { name: 'Enzyme Kinetics — substrate screen B', category: 'biochemistry'               },
  { name: 'Drug Binding — affinity screen A',     category: 'computational-chemistry'    },
  { name: 'Drug Binding — affinity screen B',     category: 'computational-chemistry'    },
  { name: 'Gene Expression — LSTM inference A',   category: 'genomics'                   },
  { name: 'Gene Expression — LSTM inference B',   category: 'genomics'                   },
  { name: 'Metabolic Flux — pathway A',           category: 'systems-biology'            },
  { name: 'Metabolic Flux — pathway B',           category: 'systems-biology'            },
  { name: 'Antibody Structure — CDR loop A',      category: 'immunology'                 },
  { name: 'Antibody Structure — CDR loop B',      category: 'immunology'                 },
  { name: 'Climate Model — CO2 forcing A',        category: 'climate-science'            },
  { name: 'Climate Model — CO2 forcing B',        category: 'climate-science'            },
  { name: 'Neural Signal — spike sorting A',      category: 'neuroscience'               },
  { name: 'Neural Signal — spike sorting B',      category: 'neuroscience'               },
  { name: 'GENESIS-001 — yield sweep A',          category: 'synthetic-biology'          },
  { name: 'GENESIS-001 — yield sweep B',          category: 'synthetic-biology'          },
  { name: 'Material Strength — ML prediction A',  category: 'materials-science'          },
  { name: 'Material Strength — ML prediction B',  category: 'materials-science'          },
];

function hashDescriptor(obj) {
  return '0x' + crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = DRY_RUN ? null : new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = DRY_RUN ? null : new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  const rewardWei  = ethers.parseEther(REWARD_ETH);
  const totalCost  = rewardWei * BigInt(REQUIRED_NODES);
  const deadline   = Math.floor(Date.now() / 1000) + DEADLINE_HOURS * 3600;

  const tasks = STRESS_TASKS.slice(0, TASKS_TO_SUBMIT);

  console.log('');
  console.log('=== OARN 10-Node Stress Test ===');
  console.log(`  Contract:      ${CONTRACT_ADDRESS}`);
  console.log(`  Tasks:         ${tasks.length}`);
  console.log(`  Required nodes: ${REQUIRED_NODES}`);
  console.log(`  Reward/node:   ${REWARD_ETH} ETH`);
  console.log(`  Cost/task:     ${ethers.formatEther(totalCost)} ETH`);
  console.log(`  Total ETH:     ${ethers.formatEther(totalCost * BigInt(tasks.length))} ETH`);
  console.log(`  Deadline:      ${DEADLINE_HOURS}h from now`);
  console.log(`  Dry run:       ${DRY_RUN}`);
  console.log('');

  if (!DRY_RUN) {
    const balance = await provider.getBalance(signer.address);
    console.log(`  Submitter:     ${signer.address}`);
    console.log(`  Balance:       ${ethers.formatEther(balance)} ETH`);
    const needed = totalCost * BigInt(tasks.length);
    if (balance < needed) {
      console.error(`ERROR: insufficient balance — need ${ethers.formatEther(needed)} ETH, have ${ethers.formatEther(balance)} ETH`);
      process.exit(1);
    }
    console.log('');
  }

  const submitted = [];
  const failed    = [];

  for (let i = 0; i < tasks.length; i++) {
    const task       = tasks[i];
    const modelHash  = hashDescriptor({ name: task.name, category: task.category, version: '1.0' });
    const inputHash  = hashDescriptor({ name: task.name, round: i, ts: Date.now() });
    const modelReqs  = task.category;

    if (DRY_RUN) {
      console.log(`[${String(i + 1).padStart(2, '0')}/${tasks.length}] DRY RUN  ${task.name}`);
      console.log(`        modelHash=${modelHash.slice(0, 18)}...  inputHash=${inputHash.slice(0, 18)}...`);
      submitted.push({ taskId: `dry-${i + 1}`, name: task.name });
      continue;
    }

    process.stdout.write(`[${String(i + 1).padStart(2, '0')}/${tasks.length}] Submitting: ${task.name} ... `);

    try {
      const tx = await contract.submitTask(
        modelHash,
        inputHash,
        modelReqs,
        rewardWei,
        BigInt(REQUIRED_NODES),
        BigInt(deadline),
        CONSENSUS_MAJORITY,
        { value: totalCost }
      );

      const receipt = await tx.wait();

      // Parse TaskCreated event to get taskId
      let taskId = '?';
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'TaskCreated') {
            taskId = parsed.args.taskId.toString();
          }
        } catch {}
      }

      console.log(`OK  taskId=${taskId}  gas=${receipt.gasUsed}`);
      submitted.push({ taskId, name: task.name, tx: tx.hash });

      // Small delay between submissions to avoid nonce issues
      if (i < tasks.length - 1) await sleep(2000);

    } catch (err) {
      console.log(`FAIL  ${err.message?.split('\n')[0]}`);
      failed.push({ name: task.name, error: err.message });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('');
  console.log('=== Results ===');
  console.log(`  Submitted: ${submitted.length} / ${tasks.length}`);
  if (failed.length > 0) {
    console.log(`  Failed:    ${failed.length}`);
    for (const f of failed) console.log(`    - ${f.name}: ${f.error?.slice(0, 80)}`);
  }
  console.log('');
  if (submitted.length > 0) {
    console.log('  Task IDs:');
    for (const s of submitted) {
      console.log(`    #${String(s.taskId).padEnd(6)}  ${s.name}`);
    }
  }
  console.log('');
  console.log('Monitor on dashboard: https://oarn-dashboard.vercel.app/researcher/tasks');
  console.log('Watch node logs:      pm2 logs oarn-node-1 --lines 50');
  console.log('');

  if (failed.length > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
