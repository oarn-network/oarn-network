#!/usr/bin/env node
/**
 * auto-blog.js — Automatically draft and commit blog posts for blog-worthy commits.
 *
 * Usage (called from GitHub Actions):
 *   node scripts/auto-blog.js
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY   — Claude API key
 *   COMMIT_MESSAGE      — Full git commit message
 *   BLOG_PAT            — GitHub PAT with write access to oarn-website
 *   GITHUB_ACTOR        — Set automatically by Actions
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const COMMIT_MESSAGE = process.env.COMMIT_MESSAGE || '';
const BLOG_PAT = process.env.BLOG_PAT;
const WEBSITE_REPO = 'github.com/oarn-network/oarn-website.git';

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const TODAY = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const SYSTEM_PROMPT = `You are the technical writer for OARN Network, a decentralized AI compute protocol on Arbitrum.
Your job: given a git commit message, decide if it warrants a public blog post, and if so write one.

Blog-worthy triggers: new feature shipped (feat:), contract deployment, network milestone, SDK release, dashboard update.
NOT blog-worthy: chore, docs typos, submodule pointer bumps with no new user-facing change, internal refactors, test fixes.

The blog-posts.json format is:
{
  "title": "string (punchy, under 70 chars)",
  "date": "${TODAY}",
  "content": "string (2-4 sentences, plain text, can use <code> tags for inline code)",
  "tags": [{"label": "string", "class": "release|research|"}, ...],
  "link": {"url": "string", "label": "string"}
}

Tag classes: "release" for code releases, "research" for science/GENESIS-001, "" for everything else.
Common tag labels: Release, Node, Dashboard, SDK, WetLab, Governance, Community, Milestone, Testnet, GENESIS-001.

Return ONLY valid JSON — no markdown, no explanation:
{
  "blog_worthy": true|false,
  "reason": "one sentence why or why not",
  "post": { ...blog entry... } | null
}`;

function callClaude(commitMessage) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Commit message:\n${commitMessage}` }],
    });

    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content?.[0]?.text ?? '';
          resolve(JSON.parse(text));
        } catch (e) {
          reject(new Error(`Failed to parse Claude response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`Analyzing commit:\n${COMMIT_MESSAGE}\n`);

  const result = await callClaude(COMMIT_MESSAGE);
  console.log(`Blog-worthy: ${result.blog_worthy}`);
  console.log(`Reason: ${result.reason}`);

  if (!result.blog_worthy || !result.post) {
    console.log('Skipping — not blog-worthy.');
    return;
  }

  console.log(`\nDrafted post: "${result.post.title}"`);

  if (!BLOG_PAT) {
    // In dry-run mode (no PAT), just print the post
    console.log('\n--- DRY RUN — would add this post ---');
    console.log(JSON.stringify(result.post, null, 2));
    return;
  }

  // Clone the website repo, prepend the post, push
  const tmpDir = '/tmp/oarn-website';
  execSync(`rm -rf ${tmpDir}`);
  try {
    execSync(`git clone https://x-access-token:${BLOG_PAT}@${WEBSITE_REPO} ${tmpDir}`, { stdio: 'pipe' });
  } catch (e) {
    console.error('ERROR: git clone failed — BLOG_PAT is likely expired or missing write access to oarn-website.');
    console.error('Renew the PAT at https://github.com/settings/tokens and update the BLOG_PAT secret.');
    throw e;
  }

  const jsonPath = path.join(tmpDir, 'blog-posts.json');
  const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Check for duplicate title (idempotency)
  if (existing.some(p => p.title === result.post.title)) {
    console.log('Post already exists — skipping.');
    return;
  }

  existing.unshift(result.post);
  fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2) + '\n');

  execSync(`git -C ${tmpDir} config user.name "oarn-auto-blog[bot]"`);
  execSync(`git -C ${tmpDir} config user.email "oarn-auto-blog[bot]@users.noreply.github.com"`);
  execSync(`git -C ${tmpDir} add blog-posts.json`);
  execSync(`git -C ${tmpDir} commit -m "blog: auto-post — ${result.post.title}"`);
  execSync(`git -C ${tmpDir} push`, { stdio: 'inherit' });

  console.log(`\n✓ Blog post published: "${result.post.title}"`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
