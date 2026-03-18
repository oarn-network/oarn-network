# OARN Network — Testnet Rewards Program

**Version:** 1.0 | **Status:** Active | **Last Updated:** 2026-03-17

---

## Overview

The OARN Testnet Rewards Program converts on-chain testnet activity into a guaranteed mainnet GOV token allocation at TGE (Token Generation Event, Q3 2026). Every task you complete, every bug you report, and every node you run on testnet is tracked on-chain and translates directly into governance power on mainnet.

**Core principle:** Testnet tokens have no value — but your activity does. All TaskRegistryV2 events are on-chain and permanently verifiable. When mainnet launches, early operators will have earned their allocation before anyone else.

---

## Points System

Points are earned through on-chain and community activity. All on-chain activities are tracked automatically via weekly snapshots of TaskRegistryV2 events.

| Activity | Points | Notes |
|----------|--------|-------|
| Task completed (matching consensus) | 15 pts | Must reach consensus to count |
| Task completed (wrong result) | 0 pts | Penalized — dishonest nodes excluded |
| 100% uptime for a full week | 50 pts bonus | Defined as: node online ≥ 7 consecutive days |
| First 20 alpha testers | 500 pts bonus | One-time, guaranteed. See Task #35 |
| Valid bug report accepted | 100 pts | Must be triaged and confirmed by team |
| Refer a node operator (runs 2+ weeks) | 200 pts | Per referred operator; tracked via form |
| Fund a research task (`fundTask()`) | 25 pts | Per unique task funded |
| GitHub PR merged | 150 pts | Any merged PR to oarn-network org |
| Community moderation (Discord/Telegram) | 50 pts/month | Appointed moderators only |

### Bonus Multipliers
- **Early bird:** 1.5x on all points earned before April 30, 2026
- **Streak bonus:** 7 consecutive days active = +25% on weekly points

---

## Tier System

Points accumulate from testnet launch through the final snapshot (2 weeks before mainnet TGE).

| Tier | Points Required | GOV Allocation at Mainnet |
|------|----------------|--------------------------|
| Bronze | 100+ pts | 1,000 GOV |
| Silver | 500+ pts | 5,000 GOV |
| Gold | 2,500+ pts | 25,000 GOV |
| Platinum | 10,000+ pts | 100,000 GOV |
| Genesis | Top 10 nodes overall | 250,000 GOV each |

**Notes:**
- Tiers are cumulative — reaching Silver means you already have Bronze
- All allocations are in addition to any public sale participation
- Genesis tier is awarded by final ranking, not just point threshold
- GOV tokens vest immediately at TGE (no cliff, no vesting schedule for testnet rewards)

---

## GOV Sub-Allocation

The GOV token has a fixed supply of 100M. The "Early Contributors" bucket (40% = 40M GOV) is sub-allocated as follows:

| Category | GOV Amount | % of 40M Bucket | Target Recipients |
|----------|-----------|-----------------|-------------------|
| Testnet node operators (tiered) | 10,000,000 | 25% | All operators who reach Bronze+ |
| Alpha testers, bug reporters, community | 4,000,000 | 10% | Task #35 participants + bug bounty |
| Developer contributors (GitHub) | 2,000,000 | 5% | PRs merged to oarn-network org |
| Remaining early airdrop at mainnet | 24,000,000 | 60% | Broader community airdrop at TGE |

**Reserve:** If testnet operator participation exceeds 10M GOV available, tier allocations scale proportionally. If participation is lower, surplus rolls into the broader airdrop pool.

---

## Snapshot Mechanism

### How Points Are Tracked
1. **On-chain source:** TaskRegistryV2 @ `0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0` (Arbitrum Sepolia)
2. **Events tracked:** `TaskClaimed`, `ResultSubmitted`, `ConsensusReached`, `TaskFunded`
3. **Off-chain source:** Bug reports (GitHub Issues tagged `bug-bounty`), referrals (Google Form), GitHub PRs

### Weekly Snapshot Schedule
- **Snapshot taken:** Every Sunday at 23:59 UTC
- **Leaderboard published:** Every Monday by 12:00 UTC
- **Channel:** Published in @OARNAlerts, Discord #node-ops-leaderboard

### Final Snapshot
- **Date:** 2 weeks before mainnet TGE (exact date announced with 30-day notice)
- **Wallet registration deadline:** Same day as final snapshot
- **KYC-light requirement:** Register your operator wallet via the official form before the deadline. Unregistered wallets cannot receive allocations.

### Leaderboard Format
Published weekly as a public Google Sheet and in Telegram/Discord:
```
Rank | Wallet (shortened) | Total Points | Tier    | Tasks Completed | Bonuses
1.   | 0xabc...def        | 12,450       | Genesis | 830             | +500 alpha
2.   | 0x123...456        | 8,201        | Platinum| 546             | +200 referral
3.   | 0x789...012        | 6,780        | Platinum| 452             | +150 PR
...
```

---

## Referral Program

Node operators can earn 200 points for each person they successfully refer who:
1. Runs a node on testnet
2. Remains active for at least 2 consecutive weeks

**How to refer:**
1. Share your referral link (generated at wallet registration)
2. Referred operator must include your wallet address when registering

**Anti-gaming:** Each wallet can only be referred once. Self-referral is not allowed.

---

## Bug Bounty Program

Valid bug reports earn 100 points each. Critical bugs may earn bonus points at team discretion.

**How to submit:**
1. Open a GitHub Issue at github.com/oarn-network with label `bug-bounty`
2. Include: description, reproduction steps, severity assessment, your wallet address
3. Team triages within 72 hours — accepted reports earn points in next weekly snapshot

**Severity guidelines:**
- Critical (smart contract exploit, fund loss): 100 pts + up to 500 bonus
- High (consensus bypass, data corruption): 100 pts + up to 200 bonus
- Medium (incorrect behavior, edge cases): 100 pts
- Low (UI/docs issues): 50 pts

---

## Participation Requirements

1. **Wallet:** Must use an Ethereum-compatible wallet (MetaMask, Frame, hardware wallet)
2. **Network:** Must run on Arbitrum Sepolia testnet
3. **Registration:** Must register wallet before final snapshot deadline
4. **Identity:** No KYC required — wallet address is your identity
5. **Eligibility:** Team members and advisors are not eligible for node operator rewards

---

## Wallet Registration Form

To receive your GOV allocation at mainnet, register your operator wallet before the final snapshot:

**Form fields:**
- Operator wallet address (Ethereum format)
- Contact email (optional, for mainnet distribution notifications)
- Referral code (if applicable)
- Confirmation that you understand testnet rewards vest at TGE

**Form URL:** Will be published in @OARNAlerts and Discord when open.

---

## Implementation Roadmap

| Date | Action |
|------|--------|
| Q1 2026 (now) | Points tracking active via on-chain snapshots |
| Q1 2026 | Leaderboard published weekly (Google Sheet) |
| April 2026 | Wallet registration form goes live |
| Q2 2026 | Rewards dashboard on oarn-dashboard.vercel.app |
| Q3 2026 July | Final snapshot + wallet registration deadline |
| Q3 2026 Aug | TGE — GOV allocations distributed |

---

## Related Tasks

| ID | Task | Priority | Status |
|----|------|----------|--------|
| R1 | Write testnet-rewards-program.md (this doc) | High | ✅ Complete |
| R2 | Create public leaderboard (Google Sheet or GitHub) | High | Pending |
| R3 | Create wallet registration form (Typeform/Google Form) | High | Pending |
| R4 | Write announcement tweet + Discord post for rewards program | High | Pending |
| R5 | Build weekly snapshot script (reads on-chain TaskRegistryV2 events) | Medium | Pending |
| R6 | Create referral tracking system (simple form or Discord bot) | Medium | Pending |
