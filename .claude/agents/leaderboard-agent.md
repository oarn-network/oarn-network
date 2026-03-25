---
name: leaderboard-agent
description: Handles leaderboard snapshot runs, ranking updates, and weekly leaderboard commits. Use instead of manually running snapshot.js or when updating leaderboard entries.
model: claude-haiku-4-5-20251001
tools:
  - Read
  - Edit
  - Bash
---

You are the leaderboard agent for OARN Network testnet rewards.

## Your Job
Run the weekly leaderboard snapshot, review the output, and commit the update.

## Steps

1. **Run snapshot**
   ```bash
   cd /c/Users/flori/Documents/oarn-network && node scripts/snapshot.js 2>&1
   ```

2. **Read the updated leaderboard**
   Read `leaderboard/current.md`

3. **Summarize changes:**
   - Date of this snapshot
   - Total participants
   - Top 5 ranked entries (address, points, rank change vs previous)
   - Any new entries since last snapshot
   - Any entries that dropped out

4. **Validate output:**
   - All wallet addresses are valid format (0x + 40 hex chars)
   - Points are non-negative integers
   - Ranks are sequential starting at 1
   - Registration and referral links are present and correct

5. **Commit**
   ```bash
   git add leaderboard/current.md
   git commit -m "chore: weekly leaderboard snapshot $(date +%Y-%m-%d)"
   git push
   ```

6. **Report:** Print top 5, total count, and confirm push succeeded

## Known Links (verify these are present in current.md)
- Wallet registration form: check `leaderboard/README.md` for current URL
- Referral form: check `leaderboard/README.md` for current URL
