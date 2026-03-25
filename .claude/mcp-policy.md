# OARN MCP Policy

## Rule: max 10 active MCPs, under 80 tools enabled

Prefer CLI-replacement skills over MCPs for routine operations — they save ~15-25k tokens per session.

## Current MCP Status

| MCP | Status | Why |
|-----|--------|-----|
| `claude-mem` (plugin) | ✅ Always ON | Cross-session memory — core to every workflow |
| GitHub MCP | ❌ Not needed | Use `gh` CLI via `/gh-pr` and `/gh-issue` skills |
| Vercel MCP | ❌ Not needed | Use `vercel` CLI via `/vercel-deploy` skill |
| sequential-thinking | ⚡ Planning only | Enable for architecture/strategy sessions, disable after |
| firecrawl | ⚡ Research only | Enable for investor-researcher agent sessions, disable after |
| railway / cloudflare | ❌ OFF | Not in OARN stack |
| clickhouse / Ableton | ❌ OFF | Irrelevant |

## CLI Skill Replacements

Instead of adding MCPs, use these slash commands:
- `/gh-pr` — create GitHub pull request via `gh pr create`
- `/gh-issue` — create/list GitHub issues via `gh issue`
- `/vercel-deploy` — deploy dashboard via `vercel --prod`
- `/deploy` — full contract deploy + checklist (already exists)

## When to Add a New MCP
Only add an MCP if:
1. The task requires real-time data that CLI cannot provide
2. The MCP provides structured access to >10 operations you'd otherwise script manually
3. Tool count stays under 80 after adding it

Always remove it when the task is done if it was added temporarily.
