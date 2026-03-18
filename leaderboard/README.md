# OARN Testnet Leaderboard

This directory contains the weekly leaderboard for the **OARN Testnet Rewards Program**.

Node operators who run tasks on Arbitrum Sepolia earn points that convert to **GOV tokens at mainnet launch (TGE Q3 2026)**.

## Files

| File | Description |
|------|-------------|
| `current.md` | Latest leaderboard (auto-updated every Sunday by GitHub Actions) |
| `referrals.csv` | Manual referral log (updated by team after validation) |
| `.snapshot-count` | Internal counter — do not edit manually |

## Points System

| Action | Points |
|--------|--------|
| Task completed matching consensus | 15 pts |
| Fund a unique research task | 25 pts |
| Referral (referred operator active 2+ weeks) | 200 pts |
| First 20 alpha testers (Task #35 bonus) | 500 pts one-time |
| Valid bug report (GitHub Issues, `bug-bounty` label) | 100+ pts |
| GitHub PR merged | 150 pts |

**Early bird multiplier: 1.5× on all points earned before April 30, 2026**

## Tier → GOV Allocation

| Tier | Min Points | GOV Allocation |
|------|------------|----------------|
| Genesis ⭐ | Top 10 nodes | 250,000 GOV each |
| Platinum | 10,000 | 100,000 GOV |
| Gold | 2,500 | 25,000 GOV |
| Silver | 500 | 5,000 GOV |
| Bronze | 100 | 1,000 GOV |

## How to Participate

1. **Run a node** — [oarn-node setup guide](https://github.com/oarn-network/oarn-node)
2. **Register your wallet** — [Wallet registration form](https://docs.google.com/forms/d/e/1FAIpQLSeOUh5Grp-ADUgS2RXd4mgbcMhv_ckb-Kf8kDrmNLBhIZhV9A/viewform) *(required before final snapshot)*
3. **Refer operators** — Share your referral link, earn 200 pts per active referral
4. **Fund research** — Visit the [OARN Dashboard](https://oarn-dashboard.vercel.app) to fund tasks

## Schedule

- **Snapshots:** Every Sunday at 23:59 UTC (automated via GitHub Actions)
- **Leaderboard published:** Every Monday by 12:00 UTC
- **Final snapshot:** 2 weeks before TGE (30-day notice given)
- **Wallet registration deadline:** Same day as final snapshot

## Full Program Details

→ [plans/testnet-rewards-program.md](../plans/testnet-rewards-program.md)
