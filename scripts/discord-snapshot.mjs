/**
 * discord-snapshot.mjs
 *
 * Reads leaderboard/current.md after a snapshot run and posts a
 * weekly summary to Discord. Called by the snapshot GitHub Actions workflow.
 *
 * Usage:
 *   DISCORD_WEBHOOK=https://... node scripts/discord-snapshot.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WEBHOOK        = process.env.DISCORD_WEBHOOK;
const LEADERBOARD    = path.join(__dirname, '..', 'leaderboard', 'current.md');
const COUNTER_FILE   = path.join(__dirname, '..', 'leaderboard', '.snapshot-count');
const DASHBOARD_URL  = 'https://oarn-dashboard.vercel.app';
const NODE_GUIDE_URL = 'https://github.com/oarn-network/oarn-node';

if (!WEBHOOK) {
  console.error('DISCORD_WEBHOOK not set — skipping Discord notification');
  process.exit(0); // Non-fatal: snapshot still succeeded
}

// ── Parse leaderboard markdown ────────────────────────────────────────────────

function parseLeaderboard(md) {
  const entries = [];
  const lines = md.split('\n');
  let inTable = false;

  for (const line of lines) {
    // Detect table rows (skip header and separator)
    if (line.startsWith('| ') && line.includes('`0x')) {
      inTable = true;
      const cols = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length >= 5) {
        entries.push({
          rank:   parseInt(cols[0]),
          wallet: cols[1].replace(/`/g, ''),
          points: parseInt(cols[2].replace(/,/g, '')),
          tier:   cols[3],
          tasks:  parseInt(cols[4]),
        });
      }
    } else if (inTable && !line.startsWith('|')) {
      break;
    }
  }

  return entries;
}

function readSnapshotNum() {
  try { return parseInt(fs.readFileSync(COUNTER_FILE, 'utf8').trim()) || '?'; }
  catch { return '?'; }
}

function tierEmoji(tier) {
  if (tier.includes('Genesis')) return '⭐';
  if (tier === 'Platinum')      return '💎';
  if (tier === 'Gold')          return '🥇';
  if (tier === 'Silver')        return '🥈';
  if (tier === 'Bronze')        return '🥉';
  return '▫️';
}

// ── Build Discord message ─────────────────────────────────────────────────────

const md = fs.readFileSync(LEADERBOARD, 'utf8');
const entries = parseLeaderboard(md);
const snapshotNum = readSnapshotNum();
const today = new Date().toISOString().split('T')[0];

let message;

if (entries.length === 0) {
  message = [
    `📊 **Weekly OARN Leaderboard — Snapshot #${snapshotNum}** (${today})`,
    '',
    'No on-chain activity recorded yet.',
    '',
    '🚀 Be the first operator on the leaderboard!',
    `Run a node → <${NODE_GUIDE_URL}>`,
    `Dashboard → <${DASHBOARD_URL}>`,
  ].join('\n');
} else {
  const top5 = entries.slice(0, 5);
  const rankLines = top5.map(e =>
    `${e.rank}. \`${e.wallet}\` — **${e.points.toLocaleString()} pts** ${tierEmoji(e.tier)} ${e.tier} | ${e.tasks} tasks`
  ).join('\n');

  message = [
    `📊 **Weekly OARN Leaderboard — Snapshot #${snapshotNum}** (${today})`,
    '',
    '🏆 **Top Operators**',
    rankLines,
    entries.length > 5 ? `*...and ${entries.length - 5} more operators*` : '',
    '',
    `👥 Total active operators: **${entries.length}**`,
    '',
    `Points convert to GOV tokens at mainnet TGE (Q3 2026). Early bird 1.5× multiplier active until April 30.`,
    '',
    `[Full leaderboard →](<${DASHBOARD_URL}>) | [Run a node →](<${NODE_GUIDE_URL}>)`,
  ].filter(l => l !== undefined).join('\n');
}

// ── Post to Discord ───────────────────────────────────────────────────────────

const res = await fetch(WEBHOOK, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: message }),
});

if (!res.ok) {
  console.error(`Discord post failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}

console.log('Discord snapshot summary posted successfully.');
