/**
 * OARN Continuous Task Submitter
 *
 * Keeps TaskRegistryV2 populated with open tasks so node operators
 * always have work to claim. Run via GitHub Actions schedule or manually.
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
import { OARNClient, ConsensusType, parseTokenAmount, cidToBytes32 } from '@oarnnetwork/sdk';

// ── Contract ABIs ─────────────────────────────────────────────────────────────
const TASK_REGISTRY_ADDRESS = '0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0';
const TASK_REGISTRY_READ_ABI = [
  'function taskCount() view returns (uint256)',
  'function tasks(uint256 taskId) view returns (uint256 id, address requester, bytes32 modelHash, bytes32 inputHash, string modelRequirements, uint256 rewardPerNode, uint256 requiredNodes, uint256 claimedCount, uint256 submittedCount, uint256 deadline, uint8 status, uint8 consensusType, uint256 createdAt, bytes32 consensusResult)',
];
const TASK_REGISTRY_WRITE_ABI = [
  'function submitTask(bytes32 modelHash, bytes32 inputHash, string modelRequirements, uint256 rewardPerNode, uint256 requiredNodes, uint256 deadline, uint8 consensusType) payable returns (uint256)',
  'event TaskCreated(uint256 indexed taskId, address indexed requester, bytes32 modelHash, uint256 rewardPerNode, uint256 requiredNodes, uint8 consensusType)',
];

// ── Config ────────────────────────────────────────────────────────────────────

const PRIVATE_KEY       = process.env.SUBMITTER_PRIVATE_KEY;
const RPC_URL           = process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const MIN_OPEN_TASKS    = parseInt(process.env.MIN_OPEN_TASKS || '3', 10);
const MAX_SUBMIT        = 3;           // Max tasks to submit in one run
const CHECK_LAST_N      = 30;         // How many recent tasks to scan for open ones
const DEADLINE_HOURS    = 48;         // Task deadline from now
const DRY_RUN           = process.env.DRY_RUN === 'true';
const DISCORD_WEBHOOK   = process.env.DISCORD_WEBHOOK || null;

// ── Task Library ──────────────────────────────────────────────────────────────
// Diverse testnet tasks. Nodes execute these and must reach consensus.
// Models are JSON descriptors (placeholder mode) — real ONNX models via Task #61.

const TASK_LIBRARY = [
  {
    id: 'protein-folding-v1',
    name: 'Protein Folding Parameter Sweep',
    category: 'structural-biology',
    model: {
      name: 'protein-stability-predictor',
      version: '0.1.0',
      type: 'regression',
      framework: 'onnx',
      inputs: ['temperature_C', 'pH', 'salt_mM'],
      outputs: ['stability_kcal_mol', 'folding_rate_s'],
    },
    inputs: {
      batch_mode: true,
      description: 'Sweep fermentation parameters for optimal protein folding stability',
      combinations: [
        { temperature_C: 25, pH: 7.0, salt_mM: 150 },
        { temperature_C: 30, pH: 7.2, salt_mM: 100 },
        { temperature_C: 37, pH: 6.8, salt_mM: 200 },
        { temperature_C: 37, pH: 7.4, salt_mM: 150 },
        { temperature_C: 42, pH: 7.0, salt_mM: 50  },
      ],
    },
    requiredNodes: 3,
    consensusType: ConsensusType.Majority,
    rewardEth: '0.001',
  },
  {
    id: 'enzyme-kinetics-v1',
    name: 'Enzyme Kinetics Optimization',
    category: 'biochemistry',
    model: {
      name: 'enzyme-kinetics-predictor',
      version: '0.1.0',
      type: 'regression',
      framework: 'onnx',
      inputs: ['substrate_mM', 'inhibitor_uM', 'temperature_C', 'pH'],
      outputs: ['Vmax', 'Km', 'kcat'],
    },
    inputs: {
      batch_mode: true,
      description: 'Michaelis-Menten kinetics across substrate and inhibitor concentrations',
      combinations: [
        { substrate_mM: 0.5,  inhibitor_uM: 0,   temperature_C: 37, pH: 7.4 },
        { substrate_mM: 1.0,  inhibitor_uM: 0,   temperature_C: 37, pH: 7.4 },
        { substrate_mM: 2.0,  inhibitor_uM: 10,  temperature_C: 37, pH: 7.4 },
        { substrate_mM: 5.0,  inhibitor_uM: 10,  temperature_C: 37, pH: 7.0 },
        { substrate_mM: 10.0, inhibitor_uM: 50,  temperature_C: 37, pH: 7.4 },
        { substrate_mM: 20.0, inhibitor_uM: 100, temperature_C: 37, pH: 7.4 },
      ],
    },
    requiredNodes: 3,
    consensusType: ConsensusType.Majority,
    rewardEth: '0.001',
  },
  {
    id: 'drug-binding-v1',
    name: 'Drug Binding Affinity Screen',
    category: 'computational-chemistry',
    model: {
      name: 'binding-affinity-predictor',
      version: '0.1.0',
      type: 'regression',
      framework: 'onnx',
      inputs: ['molecular_weight', 'logP', 'hbd', 'hba', 'tpsa'],
      outputs: ['binding_affinity_nM', 'selectivity_score'],
    },
    inputs: {
      batch_mode: true,
      description: 'Lipinski rule-of-five screen for drug-like binding candidates',
      combinations: [
        { molecular_weight: 280, logP: 1.2, hbd: 2, hba: 4, tpsa: 65  },
        { molecular_weight: 320, logP: 2.1, hbd: 1, hba: 5, tpsa: 72  },
        { molecular_weight: 380, logP: 3.4, hbd: 2, hba: 6, tpsa: 88  },
        { molecular_weight: 420, logP: 2.8, hbd: 3, hba: 7, tpsa: 101 },
        { molecular_weight: 450, logP: 4.1, hbd: 1, hba: 8, tpsa: 110 },
        { molecular_weight: 490, logP: 3.0, hbd: 2, hba: 9, tpsa: 120 },
      ],
    },
    requiredNodes: 3,
    consensusType: ConsensusType.SuperMajority,
    rewardEth: '0.002',
  },
  {
    id: 'metabolic-pathway-v1',
    name: 'Metabolic Pathway Flux Analysis',
    category: 'systems-biology',
    model: {
      name: 'flux-balance-analyzer',
      version: '0.1.0',
      type: 'optimization',
      framework: 'onnx',
      inputs: ['glucose_uptake_mmol_gDW_h', 'oxygen_uptake_mmol_gDW_h', 'growth_rate_h'],
      outputs: ['atp_yield', 'nadh_yield', 'biomass_flux'],
    },
    inputs: {
      batch_mode: true,
      description: 'Flux balance analysis across growth conditions for E. coli central metabolism',
      combinations: [
        { glucose_uptake_mmol_gDW_h: 10, oxygen_uptake_mmol_gDW_h: 15, growth_rate_h: 0.4 },
        { glucose_uptake_mmol_gDW_h: 15, oxygen_uptake_mmol_gDW_h: 20, growth_rate_h: 0.6 },
        { glucose_uptake_mmol_gDW_h: 20, oxygen_uptake_mmol_gDW_h: 0,  growth_rate_h: 0.3 },
        { glucose_uptake_mmol_gDW_h: 8,  oxygen_uptake_mmol_gDW_h: 12, growth_rate_h: 0.35 },
      ],
    },
    requiredNodes: 3,
    consensusType: ConsensusType.Unanimous,
    rewardEth: '0.002',
  },
  {
    id: 'catalyst-selectivity-v1',
    name: 'Catalyst Selectivity Screening',
    category: 'green-chemistry',
    model: {
      name: 'catalyst-selectivity-predictor',
      version: '0.1.0',
      type: 'classification',
      framework: 'onnx',
      inputs: ['temperature_C', 'pressure_bar', 'H2_ratio', 'CO2_ratio', 'residence_time_s'],
      outputs: ['methanol_selectivity', 'co_selectivity', 'conversion_rate'],
    },
    inputs: {
      batch_mode: true,
      description: 'CO2 hydrogenation catalyst parameter optimization for green methanol synthesis',
      combinations: [
        { temperature_C: 200, pressure_bar: 20, H2_ratio: 3.0, CO2_ratio: 1.0, residence_time_s: 2.0 },
        { temperature_C: 240, pressure_bar: 30, H2_ratio: 3.5, CO2_ratio: 1.0, residence_time_s: 1.5 },
        { temperature_C: 260, pressure_bar: 40, H2_ratio: 4.0, CO2_ratio: 1.0, residence_time_s: 1.0 },
        { temperature_C: 280, pressure_bar: 50, H2_ratio: 3.0, CO2_ratio: 0.8, residence_time_s: 0.8 },
        { temperature_C: 300, pressure_bar: 60, H2_ratio: 3.5, CO2_ratio: 0.5, residence_time_s: 0.5 },
      ],
    },
    requiredNodes: 3,
    consensusType: ConsensusType.Majority,
    rewardEth: '0.001',
  },
  {
    id: 'gene-expression-v1',
    name: 'Gene Expression Regulation Sweep',
    category: 'genomics',
    model: {
      name: 'gene-expression-predictor',
      version: '0.1.0',
      type: 'regression',
      framework: 'onnx',
      inputs: ['inducer_concentration_uM', 'growth_phase', 'temperature_C', 'media_pH'],
      outputs: ['expression_level_au', 'protein_yield_mg_L'],
    },
    inputs: {
      batch_mode: true,
      description: 'IPTG-induced protein expression optimization across growth conditions',
      combinations: [
        { inducer_concentration_uM: 50,  growth_phase: 0.4, temperature_C: 37, media_pH: 7.0 },
        { inducer_concentration_uM: 100, growth_phase: 0.5, temperature_C: 37, media_pH: 7.2 },
        { inducer_concentration_uM: 250, growth_phase: 0.5, temperature_C: 30, media_pH: 7.0 },
        { inducer_concentration_uM: 500, growth_phase: 0.6, temperature_C: 25, media_pH: 7.4 },
        { inducer_concentration_uM: 1000, growth_phase: 0.6, temperature_C: 30, media_pH: 7.2 },
      ],
    },
    requiredNodes: 3,
    consensusType: ConsensusType.SuperMajority,
    rewardEth: '0.002',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function formatEth(wei) {
  return (Number(wei) / 1e18).toFixed(6);
}

async function countOpenTasks(provider) {
  const contract = new ethers.Contract(TASK_REGISTRY_ADDRESS, TASK_REGISTRY_READ_ABI, provider);
  const total = Number(await contract.taskCount());
  if (total === 0) return 0;

  const now = Math.floor(Date.now() / 1000);
  // Task IDs are 1-based; scan the last CHECK_LAST_N tasks
  const startId = Math.max(1, total - CHECK_LAST_N + 1);
  let open = 0;

  for (let id = startId; id <= total; id++) {
    try {
      const task = await contract.tasks(id);
      // status 0 = Pending, 1 = Active; deadline must be in future
      const status = Number(task.status);
      const deadline = Number(task.deadline);
      if ((status === 0 || status === 1) && deadline > now) {
        open++;
      }
    } catch {
      // Task may not exist or be inaccessible — skip
    }
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

  if (!PRIVATE_KEY) {
    console.error('Error: SUBMITTER_PRIVATE_KEY env var is required');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const client = new OARNClient({ privateKey: PRIVATE_KEY, rpcUrl: RPC_URL });
  const wallet = client.getAddress();
  log(`Wallet: ${wallet}`);

  // Check balance
  const balance = await client.getBalance(wallet);
  log(`ETH balance: ${formatEth(balance.eth)}`);

  if (balance.eth < parseTokenAmount('0.01') && !DRY_RUN) {
    console.error('Error: Wallet has less than 0.01 ETH — fund it at the Arbitrum Sepolia faucet');
    process.exit(1);
  }

  // Check how many open tasks exist (use direct RPC with correct ABI)
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
  log(`Submitting ${toSubmit} new task(s)...`);

  const deadline = Math.floor(Date.now() / 1000) + DEADLINE_HOURS * 3600;
  const submitted = [];

  for (let i = 0; i < toSubmit; i++) {
    // Cycle through task library
    const template = TASK_LIBRARY[(total + i) % TASK_LIBRARY.length];
    const modelData = JSON.stringify(template.model, null, 2);
    const inputData = JSON.stringify(template.inputs, null, 2);
    const reward = parseTokenAmount(template.rewardEth);

    log(`[${i + 1}/${toSubmit}] Submitting: ${template.name}`);
    log(`  Category: ${template.category}`);
    log(`  Nodes: ${template.requiredNodes} | Consensus: ${ConsensusType[template.consensusType]} | Reward: ${template.rewardEth} ETH/node`);
    log(`  Inputs: ${template.inputs.combinations.length} parameter combinations`);

    if (DRY_RUN) {
      log('  [DRY RUN] Skipping actual submission');
      submitted.push({ name: template.name, taskId: 'DRY_RUN' });
      continue;
    }

    try {
      // Upload model and input data to IPFS
      const [modelCid, inputCid] = await Promise.all([
        client.storage.upload(modelData),
        client.storage.upload(inputData),
      ]);
      const modelHash = cidToBytes32(modelCid);
      const inputHash = cidToBytes32(inputCid);

      log(`  Model CID: ${modelCid}`);
      log(`  Input CID: ${inputCid}`);

      // Submit directly with template.name as modelRequirements so the dashboard can display it
      const signer = new ethers.Wallet(PRIVATE_KEY, provider);
      const contract = new ethers.Contract(TASK_REGISTRY_ADDRESS, TASK_REGISTRY_WRITE_ABI, signer);
      const totalReward = reward * BigInt(template.requiredNodes);
      const tx = await contract.submitTask(
        modelHash,
        inputHash,
        template.name,           // stored on-chain in calldata for dashboard display
        reward,
        template.requiredNodes,
        deadline,
        template.consensusType,
        { value: totalReward }
      );
      const receipt = await tx.wait();

      // Extract taskId from TaskCreated event
      const iface = new ethers.Interface(TASK_REGISTRY_WRITE_ABI);
      let taskId = '?';
      for (const log2 of receipt.logs) {
        try {
          const parsed = iface.parseLog(log2);
          if (parsed?.name === 'TaskCreated') { taskId = parsed.args.taskId.toString(); break; }
        } catch { /* skip */ }
      }

      log(`  Task ID: ${taskId}`);
      log(`  Tx: ${tx.hash}`);

      submitted.push({ name: template.name, taskId, tx: tx.hash });
    } catch (err) {
      log(`  ERROR submitting ${template.name}: ${err.message}`);
    }
  }

  // Summary
  log('');
  log(`Done. Submitted ${submitted.length} task(s).`);
  submitted.forEach(t => log(`  - ${t.name} → Task #${t.taskId}`));

  // Discord notification
  if (submitted.length > 0 && !DRY_RUN) {
    const lines = submitted.map(t => `• **${t.name}** → Task #${t.taskId}`).join('\n');
    await notifyDiscord(
      `🆕 **${submitted.length} new task(s) posted to testnet**\n${lines}\n\nClaim them → https://oarn-dashboard.vercel.app`
    );
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
