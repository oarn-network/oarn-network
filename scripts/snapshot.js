#!/usr/bin/env node
/**
 * snapshot.js — OARN Testnet Leaderboard Snapshot
 *
 * Reads on-chain events from TaskRegistryV2 on Arbitrum Sepolia,
 * calculates points per wallet, and writes leaderboard/current.md.
 *
 * Points system (from plans/testnet-rewards-program.md):
 *   - Task completed matching consensus: 15 pts
 *   - Fund a unique research task: 25 pts
 *   - Referral (operator active 2+ weeks): 200 pts (from referrals.csv)
 *
 * Usage:
 *   node scripts/snapshot.js
 *   node scripts/snapshot.js --from-block 12345678
 *
 * Requires: npm install --prefix scripts  (installs ethers v6)
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// ─── Config ────────────────────────────────────────────────────────────────

const RPC_URL = process.env.RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const CONTRACT_ADDRESS = "0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0";
const LEADERBOARD_DIR = path.join(__dirname, "..", "leaderboard");
const LEADERBOARD_FILE = path.join(LEADERBOARD_DIR, "current.md");
const REFERRALS_FILE = path.join(LEADERBOARD_DIR, "referrals.csv");
const COUNTER_FILE = path.join(LEADERBOARD_DIR, ".snapshot-count");

// Points (keep in sync with plans/testnet-rewards-program.md)
const POINTS = {
  TASK_CONSENSUS_MATCH: 15,
  TASK_FUNDED_UNIQUE: 25,
  REFERRAL: 200,
};

// Tiers (descending order — first match wins)
const TIERS = [
  { name: "Platinum", min: 10000 },
  { name: "Gold",     min: 2500  },
  { name: "Silver",   min: 500   },
  { name: "Bronze",   min: 100   },
  { name: "—",        min: 0     },
];

// Event ABIs
const ABI = [
  "event RewardDistributed(uint256 indexed taskId, address indexed node, uint256 amount, bool matchedConsensus)",
  "event TaskFunded(uint256 indexed taskId, address indexed funder, uint256 fundingAmount, uint256 newRewardPerNode)",
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function getTier(points, rank) {
  if (rank <= 10) return "Genesis ⭐";
  for (const t of TIERS) {
    if (points >= t.min) return t.name;
  }
  return "—";
}

function shortAddr(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function readReferrals() {
  // Returns { referrerAddress: count }
  const out = {};
  if (!fs.existsSync(REFERRALS_FILE)) return out;
  const lines = fs.readFileSync(REFERRALS_FILE, "utf8").trim().split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const [referrer] = lines[i].split(",").map(s => s.trim().toLowerCase());
    if (referrer && referrer.startsWith("0x") && referrer.length === 42) {
      out[referrer] = (out[referrer] || 0) + 1;
    }
  }
  return out;
}

function readSnapshotCount() {
  if (fs.existsSync(COUNTER_FILE)) {
    return parseInt(fs.readFileSync(COUNTER_FILE, "utf8").trim()) || 0;
  }
  return 0;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const fromBlockIdx = args.indexOf("--from-block");
  const fromBlock = fromBlockIdx !== -1 ? parseInt(args[fromBlockIdx + 1]) : 0;

  console.log("OARN Testnet Leaderboard Snapshot");
  console.log("==================================");
  console.log(`RPC:      ${RPC_URL}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`From:     block ${fromBlock}`);
  console.log();

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const iface = new ethers.Interface(ABI);

  const rewardTopic = iface.getEvent("RewardDistributed").topicHash;
  const fundedTopic = iface.getEvent("TaskFunded").topicHash;

  console.log("Fetching RewardDistributed events...");
  const rewardLogs = await provider.getLogs({
    address: CONTRACT_ADDRESS,
    topics: [rewardTopic],
    fromBlock,
    toBlock: "latest",
  });
  console.log(`  → ${rewardLogs.length} events found`);

  console.log("Fetching TaskFunded events...");
  const fundedLogs = await provider.getLogs({
    address: CONTRACT_ADDRESS,
    topics: [fundedTopic],
    fromBlock,
    toBlock: "latest",
  });
  console.log(`  → ${fundedLogs.length} events found`);

  // ─── Aggregate stats per wallet ─────────────────────────────────────────

  const wallets = {}; // lowercase address → { consensusTasks, fundedTaskIds: Set }

  function ensureWallet(addr) {
    const key = addr.toLowerCase();
    if (!wallets[key]) wallets[key] = { consensusTasks: 0, fundedTaskIds: new Set() };
    return wallets[key];
  }

  for (const log of rewardLogs) {
    const parsed = iface.parseLog(log);
    const node = parsed.args.node.toLowerCase();
    const matched = parsed.args.matchedConsensus;
    if (matched) ensureWallet(node).consensusTasks++;
  }

  for (const log of fundedLogs) {
    const parsed = iface.parseLog(log);
    const funder = parsed.args.funder.toLowerCase();
    const taskId = parsed.args.taskId.toString();
    ensureWallet(funder).fundedTaskIds.add(taskId);
  }

  // ─── Read referrals CSV ──────────────────────────────────────────────────

  const referrals = readReferrals();

  // ─── Calculate points and build entries ─────────────────────────────────

  const entries = Object.entries(wallets).map(([addr, stats]) => {
    const taskPts = stats.consensusTasks * POINTS.TASK_CONSENSUS_MATCH;
    const fundPts = stats.fundedTaskIds.size * POINTS.TASK_FUNDED_UNIQUE;
    const refCount = referrals[addr] || 0;
    const refPts = refCount * POINTS.REFERRAL;
    const total = taskPts + fundPts + refPts;
    return {
      addr,
      total,
      tasks: stats.consensusTasks,
      funded: stats.fundedTaskIds.size,
      refs: refCount,
    };
  });

  entries.sort((a, b) => b.total - a.total);

  // ─── Tier counts ─────────────────────────────────────────────────────────

  const tierCounts = {
    Genesis:  Math.min(entries.length, 10),
    Platinum: entries.filter((e, i) => i >= 10 && e.total >= 10000).length,
    Gold:     entries.filter((e, i) => i >= 10 && e.total >= 2500  && e.total < 10000).length,
    Silver:   entries.filter((e, i) => i >= 10 && e.total >= 500   && e.total < 2500 ).length,
    Bronze:   entries.filter((e, i) => i >= 10 && e.total >= 100   && e.total < 500  ).length,
  };

  // ─── Build markdown ──────────────────────────────────────────────────────

  const snapshotNum = readSnapshotCount() + 1;
  const today = new Date().toISOString().split("T")[0];

  let md = `# OARN Testnet Leaderboard\n\n`;
  md += `**Last snapshot:** ${today} | **Snapshot #${snapshotNum}**\n\n`;
  md += `> Points convert to mainnet GOV tokens at TGE (Q3 2026).\n`;
  md += `> [Register your wallet →](https://docs.google.com/forms/d/e/1FAIpQLSeOUh5Grp-ADUgS2RXd4mgbcMhv_ckb-Kf8kDrmNLBhIZhV9A/viewform) | [Referral form →](https://docs.google.com/forms/d/e/1FAIpQLSdyc2YQtXmJAhXSbg0wQd03Tb6X5KjreBokjzxswXwSaGi3tQ/viewform) | [Rewards program details →](../docs/testnet-rewards-program.md)\n\n`;

  if (entries.length === 0) {
    md += `*No on-chain activity recorded yet.*\n\n`;
    md += `Run a node and complete tasks to appear on this leaderboard.\n`;
    md += `[How to run a node →](https://github.com/oarn-network/oarn-node)\n`;
  } else {
    md += `## Rankings\n\n`;
    md += `| Rank | Wallet | Total Points | Tier | Tasks ✓ | Funded | Referrals |\n`;
    md += `|-----:|--------|-------------:|------|--------:|-------:|----------:|\n`;

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const rank = i + 1;
      const tier = getTier(e.total, rank);
      md += `| ${rank} | \`${shortAddr(e.addr)}\` | ${e.total.toLocaleString()} | ${tier} | ${e.tasks} | ${e.funded} | ${e.refs} |\n`;
    }

    md += `\n## Tier Summary\n\n`;
    md += `| Tier | Min Points | GOV Allocation | Operators |\n`;
    md += `|------|------------|----------------|-----------|\n`;
    md += `| Genesis ⭐ | Top 10 | 250,000 GOV each | ${tierCounts.Genesis} |\n`;
    md += `| Platinum | 10,000 | 100,000 GOV | ${tierCounts.Platinum} |\n`;
    md += `| Gold | 2,500 | 25,000 GOV | ${tierCounts.Gold} |\n`;
    md += `| Silver | 500 | 5,000 GOV | ${tierCounts.Silver} |\n`;
    md += `| Bronze | 100 | 1,000 GOV | ${tierCounts.Bronze} |\n`;
  }

  md += `\n---\n\n`;
  md += `*Snapshots run every Sunday at 23:59 UTC via GitHub Actions.*\n`;
  md += `*Early bird multiplier (1.5×) applies to all points earned before April 30, 2026.*\n`;
  md += `*[View full rewards program →](../docs/testnet-rewards-program.md)*\n`;

  // ─── Write files ─────────────────────────────────────────────────────────

  fs.mkdirSync(LEADERBOARD_DIR, { recursive: true });
  fs.writeFileSync(LEADERBOARD_FILE, md);
  fs.writeFileSync(COUNTER_FILE, String(snapshotNum));

  console.log();
  console.log(`Snapshot #${snapshotNum} complete (${today})`);
  console.log(`Wallets tracked: ${entries.length}`);
  console.log(`Output: ${LEADERBOARD_FILE}`);
}

main().catch(err => {
  console.error("Snapshot failed:", err.message);
  process.exit(1);
});
