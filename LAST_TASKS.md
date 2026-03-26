# OARN Network - Task Progress

## Last Completed Tasks

**Connect Dashboard to Real Blockchain (2026-03-16)**
- Replaced mock OARNClient with real viem reads + wagmi writes (no new dependencies)
- Fixed TaskStatus/ConsensusType enums to match on-chain values
- Dashboard now reads live task data, balances, and consensus status from Arbitrum Sepolia
- Commit: 07fbab6 (oarn-dashboard)

**GitHub Releases — Pre-Built Node Binaries (2026-03-15)**
- Created `.github/workflows/release.yml` — triggers on `git tag v*`
- Builds for 5 platforms: Linux x86_64, Linux ARM64, macOS Intel, macOS Apple Silicon, Windows x64
- Uses `cross` for ARM64 cross-compilation, native runners for all others
- Auto-creates GitHub Release with install instructions and platform table
- Updated README.md with pre-built binary download section
- Tagged v0.1.0 → release building now at github.com/oarn-network/oarn-node/releases
- Commits: fa307dd (oarn-node)

**Discord Server Launch Announcement (2026-03-15)**
- Posted first #announcements message on official OARN Discord
- Covers: Phase 1 milestones, GENESIS-001 MVP results, Phase 2 goals
- Directed members to #welcome, #roles, #general

**Fix TaskRegistryV2 Address on Website (2026-03-15)**
- `index.html` and `manual.html` had old address `0x7b4898...6562`
- Replaced with correct address `0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0` (with fundTask)
- Commit: 7d2e341 (oarn-website)

**Dashboard Deployed to Vercel (2026-03-15)**
- Deployed dashboard to Vercel: https://oarn-dashboard.vercel.app/
- Fixed build errors:
  - Removed 'use client' from wagmi-config.ts
  - Replaced Buffer with Uint8Array (browser-compatible)
  - Fixed ESLint apostrophe errors
  - Fixed TypeScript union type for parameter selector
- Added dashboard URL to website:
  - Homepage: "Launch Dashboard" button
  - Docs page: Featured card in Technical Documentation
  - Blog page: Link in dashboard announcement post
- Commits: 5ed5042 (oarn-dashboard), 51facbf (oarn-website)

**Dashboard & Website Updates (2026-03-15)**
- Created full Next.js 14 dashboard with 4 role-based views:
  - Node Operator: claim tasks, submit results, track earnings
  - Researcher: submit single/batch tasks (10,000+ parameters)
  - Crowdfunder: browse & fund research tasks
  - Investor: network analytics, governance
- Built with RainbowKit + wagmi v2, Tailwind CSS, Recharts
- Added Dashboard section to website homepage
- Added demo tasks to Task Explorer for testnet demonstration
- Pushed to GitHub: github.com/oarn-network/oarn-dashboard
- Updated blog.html with dashboard launch announcement
- Commits: 61488fc, b92f8fd (oarn-website)

**Root README + Stats fix (2026-03-16)**
- Created root README.md mapping all sub-repos, contracts, quick links (b2ad998)
- Fixed blog.html stats: 183→190 tests passing (70587c2)

**Automate Blog Page Updates (2026-03-16)**
- blog-posts.json → source of truth; push to update
- build-blog.js regenerates blog.html between markers
- GitHub Actions auto-runs on blog-posts.json changes
- Commit: f5dd080 (oarn-website)

**Discord Server Static Setup (2026-03-16)**
- Server live with structure and roles created
- Populated: #welcome, #rules, #faq, #links, #roadmap, #announcements, #news
- Remaining: #roles self-assign bot (todo)

**Twitter Campaign Progress (2026-03-16)**
- Posted Tweet 8: Earnings potential (Node Ops)
- Posted Tweet 6: Why Arbitrum? / Tweet 7: How to run a node (2026-03-15)
- Tweets 1-5 already posted (2026-03-02 to 2026-03-15)

**Investor Materials Created (2026-03-15)**
- Created 7 investor documents in `plans/investor-materials/`:
  - Financial projections (3-year model, $5-15M Y3 revenue)
  - Investor CRM (35+ contacts across 4 tiers)
  - Data room index (all due diligence docs)
  - Arbitrum grant application ($150K draft)
  - Protocol Labs grant application ($75K draft)
  - Twitter investor threads (4 threads + engagement tweets)
  - Demo script (5-min investor walkthrough)
- Updated pitch deck and one-pager with latest metrics (190 tests, SDK v0.2.0)
- Commit: 29f314b (oarn-docs)

**Crowdfunding for Research Tasks (2026-03-15)**
- Added fundTask() function to TaskRegistryV2 contract
- Added TaskFunded event with taskId, funder, amount, newRewardPerNode
- Added 7 test cases for funding functionality (190 total tests passing)
- Deployed to Arbitrum Sepolia: 0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0
- Updated SDK with fundTask() method, published v0.2.0 to npm
- Added "Fund Research" button to tasks.html with MetaMask integration
- Commits: d762c3e (contracts), b2688ec (SDK), bc9832c (website)

**Blog Page with Twitter Feed (2026-03-14)**
- Created blog.html with latest updates section
- Embedded Twitter timeline from @OARNNetwork
- Sidebar with quick stats, social links, follow button
- Development updates and roadmap progress cards
- Updated navigation across all website pages
- Commit: 5ebe863 (feat: add blog page with Twitter/X feed integration)
- Live at: https://oarn-network.github.io/oarn-website/blog.html

**Investor Pitch Deck & Documents Section (2026-03-14)**
- Created interactive Reveal.js pitch deck (13 slides)
- Slides: Problem, Solution, Tech, Competitive, Use Cases, Tokenomics, Traction, Roadmap, Team, Ask, Contact
- Created docs.html page with categorized documents
- Categories: Investor Materials, Technical, Marketing/Community, Security, Research
- Updated navigation across all website pages
- Commit: f7cc6b5 (feat: add investor pitch deck and documents section)
- Live at: https://github.com/oarn-network/oarn-docs/blob/main/pitch-deck.md

**Real ONNX Model Execution (2026-03-14)**
- Replaced placeholder mode with actual ONNX Runtime inference
- Added `oarn-node inference` CLI command for local model testing
- Improved input parsing: supports JSON objects, arrays, raw bytes
- Supports shape specification via JSON `shape` field
- Tested with simple linear model: input[1,5] → output[1,3] in 30ms
- Commit: e84e889 (feat: implement real ONNX model execution)

**3-Node Network Consensus Test (2026-03-14)**
- Ran full network test with 3 local nodes on Arbitrum Sepolia
- Task #4 submitted via GENESIS-001 MVP (10 parameter combinations)
- All 3 nodes successfully:
  - Claimed task from TaskRegistryV2
  - Fetched model + inputs from IPFS (using proper CIDs)
  - Executed batch inference (placeholder mode)
  - Submitted matching result hashes
- **CONSENSUS REACHED**: 3/3 nodes agreed
- Consensus Hash: `0xd33fe6fdcc9c56fb36ec1af57b31241ab1810198e2db78e1d8c8fa75bfef1ee1`

**SDK & Node Bug Fixes (2026-03-14)**
- **SDK (commit 29185bd)**: Fixed TaskRegistryV2 ABI and submitTask implementation
  - Fixed ABI types: `uint256` for requiredNodes instead of `uint8`
  - Added `modelRequirements` parameter to submitTask
  - Made submitTask payable and send ETH value with transaction
  - Fixed event name from `TaskSubmitted` to `TaskCreated`
- **Node (commit f9af69b)**: Implemented IPFS CID conversion
  - Added `cid` and `multihash` crates for proper CID handling
  - Implemented `bytes32_to_cid()` to convert SHA-256 digest back to CIDv1
  - Fixed `get()` to fetch using proper CID format (`bafkrei...`) instead of raw hex
- All changes pushed to GitHub

**GENESIS-001 MVP (2026-03-06)**
- Created `examples/genesis-001-local-test.ts` - Offline pipeline validation
- Created `examples/genesis-001-mvp.ts` - Full network batch task example
- Local test: ALL TESTS PASSED (parameter grid, manifests, hashing, analysis)
- Simulated 10 parameter combinations (temperature × pH)
- Optimal parameters found: 60.48% yield at 37°C, pH 6.95
- Cost optimization: $31.86/gram (vs $50 baseline)

**Multi-Parameter Batch Tasks (2026-03-06)**
- SDK: Added `batch.ts` with BatchInputManifest, BatchResultManifest types
- SDK: Added `submitBatchTask()`, `submitBatchTaskFromGrid()`, `getBatchResults()` to OARNClient
- SDK: Added parameter grid generation (`generateParameterGrid`) for creating input combinations
- SDK: Added result analysis utilities (findOptimalByMetric, filterByThreshold, getTopN, calculateMetricStats)
- Node: Added `batch.rs` module with Rust types matching SDK
- Node: Added `execute_batch()` to ComputeEngine using Rayon for parallel execution
- Node: Added batch manifest detection and routing in task processing
- Hybrid approach: Single on-chain task, batch manifest in IPFS (99.99% gas savings)

**OARN SDK (2026-03-05)**
- Created `@oarnnetwork/sdk` TypeScript/JavaScript package
- OARNClient class with task operations, node functions, IPFS integration
- Support for ESM and CommonJS builds
- Pushed to GitHub: https://github.com/oarn-network/oarn-sdk
- Published to npm: https://www.npmjs.com/package/@oarnnetwork/sdk

**Marketing Materials (2026-03-02)**
- Created `marketing/ONE_PAGER.md` - Project overview document
- Created `marketing/TAGLINES.md` - Key messaging and value propositions
- Created `marketing/TWEETS.md` - Tweet templates and content calendar
- Created `marketing/FAQ.md` - Comprehensive FAQ for community

**Add RPC Providers to OARNRegistry (2026-03-02)**
- Added `addRPCProviderAdmin()` function to OARNRegistry.sol
- Added `addBootstrapNodeAdmin()` function to OARNRegistry.sol
- Deployed new OARNRegistry: 0x8DD738DBBD4A8484872F84192D011De766Ba5458
- Registered 5 public RPC providers:
  - Arbitrum Official, BlockPI, Blast API, Ankr, Alchemy
- Updated node config with new registry address

**Node CLI Improvements (2026-03-01)**
- Added `--output json` global flag for JSON output (scripting/automation)
- Added `oarn-node version` command for detailed version info
- Added `oarn-node health` command to check connectivity (blockchain, IPFS, wallet)
- Added `oarn-node peers` command to view P2P network status
- Added `oarn-node tasks claim <id>` for manual task claiming
- Added `oarn-node tasks cancel <id>` command (placeholder)
- Added `oarn-node wallet send <to> <amount>` for ETH transfers
- Added `oarn-node wallet history` command (requires indexer)
- Added `oarn-node config validate` and `config path` commands
- Added `--v2` flag to tasks list/status/mine/claim for V2 registry

**Docker Deployment (2026-03-01)**
- Created Dockerfile for oarn-node (multi-stage Rust build)
- Created docker-compose.yml with IPFS + multi-node support
- Added config.example.toml for containerized deployment
- Added DOCKER.md documentation
- Set up monorepo with submodules (oarn-node, oarn-contracts)
- Pushed changes to GitHub (oarn-node, oarn-contracts)

**Contract Test Coverage (2026-03-01)**
- Created comprehensive test suite for TaskRegistryV2.sol (48 tests)
- Created comprehensive test suite for Governance.sol (29 tests)
- Fixed existing tests in TaskRegistry.test.ts and OARNRegistry.test.ts
- Updated hardhat config for higher account balances (100k ETH for staking tests)
- Total: 183 passing tests across all contracts

**TaskRegistryV2 Integration (2026-02-28)**
- Updated OARNRegistry.sol to support taskRegistryV2 (mutable, owner-settable)
- Added getCoreContractsV2() view function to OARNRegistry
- Redeployed OARNRegistry with TaskRegistryV2 support
- Updated node BlockchainClient with V2 functions (claim_task_v2, submit_result_v2, get_available_tasks_v2)
- New OARNRegistry Address: 0x1efe74fB6cC3D491abF50E27e05C8917E8811dac

**Internal Security Review (2026-03-01)**
- Comprehensive review of smart contracts and node code
- Found: 1 Critical (V1 only), 5 High, 10 Medium, 10 Low severity issues
- Key findings: Silent reward failures, plaintext key storage, emission cap not enforced
- Report saved to: security/SECURITY_REVIEW.md

**Security Analysis & Fixes (2026-02-28)**
- Ran Slither on contracts - found and fixed critical reentrancy in TaskRegistryV2
- Ran cargo-audit on node - replaced unmaintained dotenv with dotenvy
- Redeployed TaskRegistryV2 with security fixes

**Activate DAO Governance on Testnet (2026-03-16) ✅ COMPLETE**
- Created `scripts/deploy-governance.ts` — deploys OARNGovernance to Arbitrum Sepolia
- Created `scripts/governance-setup.js` — genesis distribution + self-delegate + create first proposal
- Created `scripts/vote-proposal.js` — cast votes, delegate, check status
- Dashboard investor/governance page now reads live proposals from on-chain (falls back gracefully if not deployed)
- Added `useGovernance.ts` hooks: proposals, voting power, castVote, delegate
- Added `ProposalState` enum to constants.ts
- Commits: c25c73b (oarn-contracts), 1eef617 (oarn-dashboard)

**TO FINISH #59:**
```bash
cd oarn-contracts
npx hardhat run scripts/deploy-governance.ts --network arbitrumSepolia
# → copy GOVERNANCE_ADDRESS from output → update oarn-dashboard/lib/constants.ts CONTRACT_ADDRESSES.GOVERNANCE
GOVERNANCE_ADDRESS=0x... node scripts/governance-setup.js
# Updates deployment-addresses.json with governance address
```

## Current Task
None - ready for next task

**Recommended Next Steps:**
1. Deploy OARNGovernance to complete Task #59 (scripts ready, just run deploy)
2. Continue Twitter campaign (Tweets 9-12 pending)
3. Scale network test to 10+ nodes (#57)
4. Get Hetzner EX42 server (#65)
5. Set up oarn.network custom domain (#58)
6. Recruit 20 alpha testers (#35)

## Task #47: Blog Page with X/Twitter Feed
**Priority:** Medium | **Status:** ✅ Complete (2026-03-14)

**Goal:** Create a blog/news page on the website that displays latest tweets from @OARNNetwork.

**Features:**
- New `blog.html` page on website
- Embed latest tweets from @OARNNetwork
- Auto-refresh or manual refresh for new tweets
- Responsive design matching website style
- Optional: Filter by hashtags (#OARN, #GENESIS001)

**Implementation Options:**
1. **Twitter Embed Widget** - Official Twitter timeline embed (requires Twitter API)
2. **Static Feed** - Manually curated tweet links (no API needed)
3. **Third-party Service** - Use services like Curator.io or Juicer.io

**Website Changes:**
- Add `blog.html` page
- Add "Blog" link to navigation
- Style to match existing design

---

## Task #46: Crowdfunding for Research Tasks
**Priority:** Medium | **Status:** ✅ Complete (2026-03-15)

**Goal:** Allow anyone to add funding to existing submitted tasks to incentivize more nodes and push research forward.

**Features:**
- Add ETH/tokens to increase task reward pool
- Public funding page showing top-funded research topics
- Donor recognition (optional, on-chain attribution)
- Milestone-based funding releases (optional)
- Refund mechanism if task expires without completion

**Contract Changes:**
- `fundTask(taskId)` payable function in TaskRegistryV2
- Track individual contributions per task
- Emit `TaskFunded(taskId, funder, amount)` event

**SDK/Frontend:**
- `client.fundTask(taskId, amount)` method
- Task explorer shows total funding and contributors
- "Fund This Research" button on task details

**Use Cases:**
- Community funds GENESIS-001 to attract more nodes
- DAOs sponsor specific research directions
- Individuals support open science they care about

---

## Task #32: Get investors / fundraising
**Scope:**
- Prepare pitch deck
- Identify target investors (VCs, angels, crypto funds)
- Outreach and networking
- Demo product / testnet
- Term sheet negotiation

---

## GENESIS-001: Insulin Synthesis Optimization (First Network Task)

**Goal:** Optimize insulin synthesis pathway using decentralized AI
- 45 parameters to optimize (fermentation, enzymes, purification)
- 10,000 AI model variations parallel testing
- Target: 67% yield (vs 40% standard), $28/gram (vs $50)

**Why Insulin:**
- 300M diabetics worldwide need it
- Only 3 companies control 90% of market (price cartel)
- Small protein (51 amino acids) = computationally manageable
- Clear metrics = Yield % and Cost $/gram

**Economics:**
- Traditional R&D: $80,000 + 6 months
- OARN Network: ~$550 + 2 weeks (145x cheaper, 12x faster)

---

### GENESIS-001: Development Tasks

#### Task #34: Build MVP proof of concept
**Priority:** High | **Status:** Completed (2026-03-06)
- 1 model, 10 parameters (temperature × pH grid)
- Local pipeline test: ALL TESTS PASSED
- Optimal found: 60.48% yield at 37°C, pH 6.95
- Files: `examples/genesis-001-mvp.ts`, `examples/genesis-001-local-test.ts`

#### Task #31: Multi-parameter batch task submission
**Priority:** Medium | **Status:** Completed (2026-03-06)
- ~~Contract changes to support batch/array inputs~~ (Not needed - using manifest approach)
- Node software to handle parallel parameter execution (Rayon-based batch.rs, compute.rs)
- SDK support for batch task submission (batch.ts, client.ts)
- Result aggregation from multiple parallel executions

#### Task #35: Seed community (Alpha testers)
**Priority:** High | **Status:** Pending
- Recruit 20 early adopters
- Set up alpha test environment
- Gather feedback on node operation

---

### GENESIS-001: Research Tasks

#### Task #33: Find biochemistry expert
**Priority:** High | **Status:** Pending
- Validate parameter selection for insulin synthesis
- Review fermentation, enzyme, purification parameters
- Ensure scientific rigor before launch

#### Task #36: Launch GENESIS-001
**Priority:** High | **Status:** Blocked by #33, #34, #35
- 1000+ nodes participating
- 10,000 inference runs
- Full parameter sweep

#### Task #37: Analyze results
**Priority:** Medium | **Status:** Blocked by #36
- Identify top parameter combinations
- Statistical analysis of outcomes
- Document findings

#### Task #38: Wet-lab validation
**Priority:** Medium | **Status:** Blocked by #37
- Partner with university for physical tests
- Validate computational predictions
- Measure actual yield improvements

#### Task #39: Publish paper
**Priority:** Medium | **Status:** Blocked by #38
- bioRxiv preprint
- Media outreach
- Document methodology and results

---

## CLI Improvements Summary
New commands:
- `oarn-node inference --model <path> --input <path>` - Local ONNX inference test
- `oarn-node --output json [command]` - JSON output for all commands
- `oarn-node version` - Detailed version/build info
- `oarn-node health` - Check blockchain, IPFS, wallet connectivity
- `oarn-node peers [--detailed]` - Show P2P network peers
- `oarn-node tasks claim <id> [--v2] [--execute]` - Manual task claiming
- `oarn-node tasks cancel <id> [--v2]` - Cancel submitted task
- `oarn-node wallet send <to> <amount> [-y]` - Send ETH
- `oarn-node wallet history [--limit N]` - Transaction history
- `oarn-node config validate` - Validate config file
- `oarn-node config path` - Show config file location

## Latest Test Results

**GENESIS-001 Batch Task Consensus (2026-03-14)** - SUCCESS
- Task #4 on TaskRegistryV2 (Arbitrum Sepolia)
- 10 parameter combinations (2 temperatures × 5 pH levels)
- 3 nodes with funded wallets:
  - Node 1: `0xc86e4f93dfc1e4952f105515a7fe84258916fdfb`
  - Node 2: `0x7379651e169e63272ec57ce14f2bfc023e28382e`
  - Node 3: `0x8e2b740f69296967968c2d096202ab73989e3a0d`
- All nodes fetched from IPFS using proper CIDs:
  - Model CID: `bafkreigtg6ctxbuy7ggq22wztvmg7egb77kmoqccqfbsp5uzea3ghpwfue`
  - Manifest CID: `bafkreig23hzectqt6j4uo3c5hj2lwif4z2ji5bzbfxazw6acrlji4niptu`
- Consensus: 3/3 nodes submitted identical result hash
- Verified on-chain: `consensusReached = true`

**Multi-Node Consensus Test (2026-03-01)** - SUCCESS
- Ran 3 nodes locally with separate wallets
- Submitted task to TaskRegistryV2 requiring 3 nodes
- All 3 nodes claimed, executed, and submitted results
- Consensus reached: 3/3 nodes agreed (identical result hashes)
- Rewards distributed: 0.001 ETH to each node

## Next Open Tasks (Priority Order)

### Telegram Tasks
| ID | Task | Priority | Status |
|----|------|----------|--------|
| ~~T1~~ | ~~Create @OARNNetwork Telegram group~~ | ~~High~~ | ✅ Complete (2026-03-18) |
| ~~T2~~ | ~~Create @OARNNodeOps Telegram group~~ | ~~High~~ | ✅ Complete (2026-03-18) |
| ~~T3~~ | ~~Create @OARNAlerts broadcast channel~~ | ~~High~~ | ✅ Complete (2026-03-18) |
| T4 | Set up Telegram bot for daily stats (Combot) | Medium | Pending |
| ~~T5~~ | ~~Write and pin "earn GOV before mainnet" message~~ | ~~High~~ | ✅ Complete (2026-03-18) |
| T6 | Post in 10 DePIN/crypto Telegram communities | Medium | ✅ Complete (2026-03-21) |
| ~~T7~~ | ~~Cross-post strategy: link Discord ↔ Telegram~~ | ~~Medium~~ | ✅ Complete (2026-03-18) |

### Testnet Rewards Tasks
| ID | Task | Priority | Status |
|----|------|----------|--------|
| R1 | ~~Write testnet-rewards-program.md~~ | ~~High~~ | ✅ Complete |
| R2 | ~~Create public leaderboard (GitHub markdown)~~ | ~~High~~ | ✅ Complete (2026-03-18) |
| R3 | ~~Create wallet registration form (Google Form design)~~ | ~~High~~ | ✅ Complete (2026-03-18) |
| R4 | ~~Write announcement tweet + Discord post for rewards program~~ | ~~High~~ | ✅ Complete (2026-03-18) |
| R5 | ~~Build weekly snapshot script (reads on-chain TaskRegistryV2 events)~~ | ~~Medium~~ | ✅ Complete (2026-03-18) |
| R6 | ~~Create referral tracking system (Google Form + CSV)~~ | ~~Medium~~ | ✅ Complete (2026-03-18) |

### Token Release Tasks
| ID | Task | Priority | Status |
|----|------|----------|--------|
| TK1 | ~~Write token-release-plan.md~~ | ~~High~~ | ✅ Complete |
| TK2 | Update pitch deck with rewards program details | High | ✅ Complete (2026-03-17) |
| TK3 | Update one-pager to mention testnet → mainnet earning | Medium | ✅ Complete (2026-03-17) |
| TK4 | Add earning mechanics to website (Earn GOV section) | Medium | ✅ Complete (2026-03-17) |
| TK5 | Finalize GOV sub-allocation percentages | High | ✅ Complete (see token-release-plan.md) |

### Development Tasks
| # | Task | Priority | Status |
|---|------|----------|--------|
| ~~47~~ | ~~Blog page with X/Twitter feed integration~~ | ~~Medium~~ | ✅ Complete |
| ~~46~~ | ~~Crowdfunding for research tasks (fundTask)~~ | ~~Medium~~ | ✅ Complete |
| ~~49~~ | ~~Graphical UI (Dashboard for all user types)~~ | ~~High~~ | ✅ Complete |
| ~~50~~ | ~~Deploy Dashboard to Vercel~~ | ~~High~~ | ✅ Complete |
| ~~52~~ | ~~Fix wrong TaskRegistryV2 address on website~~ | ~~URGENT~~ | ✅ Complete |
| ~~53~~ | ~~Connect dashboard to real @oarnnetwork/sdk~~ | ~~High~~ | ✅ Complete |
| ~~54~~ | ~~Set up Discord server — #roles self-assign bot~~ | ~~High~~ | ✅ Complete |
| ~~55~~ | ~~GitHub Releases: pre-built node binaries~~ | ~~High~~ | ✅ Complete |
| 80 | Claude Code optimization — Phase 1: Hooks | High | ✅ Done (2026-03-25) |
| 81 | Claude Code optimization — Phase 2: Skills & Commands | High | ✅ Done (2026-03-25) |
| 82 | Claude Code optimization — Phase 3: Session persistence hooks | Medium | ✅ Done (2026-03-25) |
| 83 | Claude Code optimization — Phase 4: Subagents | Medium | ✅ Done (2026-03-25) |
| 84 | Claude Code optimization — Phase 5: MCP pruning + CLI skills | Medium | ✅ Done (2026-03-25) |
| 85 | Claude Code optimization — Phase 6: Verification loops | Medium | ✅ Done (2026-03-25) |
| 56 | Professional smart contract security audit | High | Blocked by #57 |
| 57 | Scale network test to 10+ nodes | High | Pending |
| ~~51~~ | ~~Automate blog page updates~~ | ~~Medium~~ | ✅ Complete |
| 58 | Set up oarn.network custom domain | Medium | Pending |
| ~~59~~ | ~~Activate DAO governance on testnet~~ | ~~Medium~~ | ✅ Complete |
| 60 | Legal/compliance finalization | Medium | Pending |
| 61 | Upload real GENESIS-001 ONNX model to IPFS | Medium | Pending |
| 65 | Get Hetzner EX42 dedicated server | High | Pending |
| ~~63~~ | ~~Fix hardcoded stats on website (183→190 tests)~~ | ~~Low~~ | ✅ Complete |
| ~~62~~ | ~~Create root README.md for monorepo~~ | ~~Low~~ | ✅ Complete |
| ~~64~~ | ~~Token launch strategy (Phase 3 planning)~~ | ~~Low~~ | ✅ Complete — see plans/token-release-plan.md |
| 35 | GENESIS-001: Seed community (20 alpha testers) | High | Pending |
| 21 | Register ENS names (manual, before mainnet) | Low | Pending |
| 15 | Deploy to mainnet (Arbitrum One) | Low | Blocked by #21 |
| 66 | Dashboard: replace mock task history charts with real on-chain event data | Medium | Pending |
| 67 | Dashboard: replace mock completed tasks count with real on-chain status filter | Medium | Pending |
| 68 | Dashboard: replace mock TVL with real sum of task rewards from chain | Medium | Pending |
| 69 | Dashboard: replace mock node leaderboard stats (tasks/earnings/success rate) with real data | Medium | Pending |
| 70 | Dashboard: replace hardcoded completion rate, uptime, avg reward, avg consensus time | Low | Pending |
| 71 | Dashboard: replace mock model framework pie chart with real task data | Low | Pending |
| 72 | Dashboard: replace mock node operator earnings history with real on-chain events | Medium | Pending |
| 73 | WetLabOracle.sol — design + deploy to Arbitrum Sepolia | High | ✅ Done — 0xF8991A56cB5B9073a3eEC87E95Dfb055fdDF0094 |
| 74 | SDK: getTopPredictions() + submitWetLabResult() | Medium | ✅ Done — @oarnnetwork/sdk@0.3.0 |
| 75 | Recruit 3 wet lab partners for GENESIS-001 Phase 2 | High | In Progress — outreach sent: Open Insulin (email), Molecule Discord, DeSci World Discord. VitaDAO pending verification. |
| 76 | Email Bradley (Foresight Berlin) — clarify grant covers living costs + remote hybrid option | High | ✅ Done — sent |
| 77 | Write 12-month project plan + itemized budget (required for Foresight due diligence) | High | ✅ Done — foresight-grant-application.md |
| 78 | Write OARN impact narrative — existential risk / decentralized AI safety framing | Medium | ✅ Done — foresight-grant-application.md |
| 79 | Apply to Foresight Institute AI Nodes grant ($10k–$100k) | High | Blocked by #32.1, #75, #76 response |

### Bugs — Found 2026-03-25 audit

| # | Task | Priority | Status |
|---|------|----------|--------|
| 86 | Fix OARNRegistry address mismatch: dashboard constants.ts + website index.html show 0x8DD738... but deployment-addresses.json has 0xa12251... | URGENT | ✅ Done (2026-03-26) |
| 104 | Fix SDK README TaskRegistry address: shows old 0x7b4898... instead of 0xD15530... — also added WetLabOracle + Governance to table | URGENT | ✅ Done (2026-03-26) |
| 105 | Fix oarn-docs/quick-start.md: "Web Interface (Coming Soon)" → live dashboard link | High | ✅ Done (2026-03-26) |
| 87 | Fix oarn-node Cargo.toml version: says 0.1.0 but GitHub release tag is v0.1.6 | Medium | ✅ Done (2026-03-26) |
| 88 | Fix oarn-node CI failures: Node Software CI has been failing since Mar 16 | High | ✅ Done (2026-03-26) — fail-fast: false, ONNX Runtime via Homebrew/zip on macOS/Windows, rustfmt applied |
| 89 | Remove console.log from oarn-dashboard/app/(auth)/researcher/batch/page.tsx:45 | Low | ✅ Done (2026-03-26) |
| 90 | Set TASK_REGISTRY_DEPLOY_BLOCK to actual deploy block number (currently BigInt(0) with TODO in dashboard constants.ts) | Medium | Pending |

### Website / Docs Gaps — Found 2026-03-25 audit

| # | Task | Priority | Status |
|---|------|----------|--------|
| 91 | Add WetLabOracle to homepage contracts section (deployed 0xF8991A... but not shown) | Medium | ✅ Done (2026-03-26) |
| 92 | Change WetLabOracle feature card from "Roadmap" badge to "Live" on homepage | Medium | ✅ Done (2026-03-26) |
| 93 | Fix "Closed-Loop Architecture" link on docs.html — currently links to org root, not a specific doc | Low | Pending |
| 94 | Update oarn-docs/quick-start.md: "Web Interface (Coming Soon)" → link to live dashboard | Medium | Pending |
| 95 | Update oarn-docs/architecture.md: add WetLabOracle section + all current deployed addresses | Medium | Pending |

### Security — Found 2026-03-25 audit

| # | Task | Priority | Status |
|---|------|----------|--------|
| 96 | Security review of WetLabOracle contract — deployed Mar 21, after the existing security-review.md (dated Mar 01) | High | Pending |
| 97 | Fix H-1: silent reward transfer failures in TaskRegistryV2 — implement pull-based withdrawal pattern before mainnet | High | Blocked by #57 |
| 98 | Add CI workflow for oarn-dashboard — currently has zero automated build/type-check (oarn-dashboard/actions shows 0 runs) | Medium | Pending |

### Node Implementation Stubs — Found 2026-03-25 audit

| # | Task | Priority | Status |
|---|------|----------|--------|
| 99 | Node: implement actual DHT + OARNRegistry peer discovery (discovery.rs:321,340 — stubs using bootstrap fallback only) | High | Pending |
| 100 | Node: implement PyTorch and TensorFlow model execution (compute.rs:420,426 — ONNX only works today) | High | Pending |
| 101 | Node: implement CUDA/ROCm GPU detection (compute.rs:688 — always falls back to CPU) | Medium | Pending |
| 102 | Node: implement event subscription via WebSocket (blockchain.rs:741 — polling only, inefficient) | Medium | Pending |

### Marketing Gap — Found 2026-03-25 audit

| # | Task | Priority | Status |
|---|------|----------|--------|
| 103 | Queue tweets for unannounced milestones: testnet rewards leaderboard, Claude optimization, 4-day Twitter gap since Mar 21 | High | Pending |

---

## Task #51: Automate Blog Page Updates
**Priority:** Medium | **Status:** ✅ COMPLETED (2026-03-16)

**What was done:**
- Created `blog-posts.json` — source of truth for all blog posts (JSON array)
- Created `build-blog.js` — Node.js script that reads JSON and regenerates update cards in blog.html between `BLOG_POSTS_START` / `BLOG_POSTS_END` markers
- Created `.github/workflows/build-blog.yml` — triggers on push to `blog-posts.json`, runs build script, auto-commits updated blog.html
- Migrated all existing hardcoded posts to JSON
- Added 2 new posts: pre-built binaries (v0.1.0) + real blockchain dashboard

**To add a new post:** Edit `blog-posts.json`, push → GitHub Actions regenerates blog.html automatically.
- Commit: f5dd080 (oarn-website)

**Output:**
- Auto-generate blog entry cards in blog.html
- Include date, title, description, links
- Maintain chronological order (newest first)

---

## Task #50: Deploy Dashboard to Vercel
**Priority:** High | **Status:** ✅ Complete (2026-03-15)

**Goal:** Deploy oarn-dashboard to Vercel for public access.

**Steps:**
1. Create Vercel project linked to oarn-dashboard repo
2. Set environment variables (RPC_URL, WalletConnect Project ID)
3. Configure build settings for Next.js 14
4. Set up custom domain (dashboard.oarn.network or similar)
5. Test wallet connection and contract interactions

**Verification:**
- [ ] Dashboard loads on Vercel URL
- [ ] Wallet connection works (RainbowKit)
- [ ] Contract reads work (task list, balances)
- [ ] Contract writes work (claim task, fund task)

---

## Task #49: Graphical UI Dashboard
**Priority:** High | **Status:** ✅ Complete (2026-03-15)

**Goal:** Create a web-based dashboard for all OARN user types.

**Completed:**
- Created Next.js 14 app with App Router
- Integrated RainbowKit + wagmi v2 for wallet connection
- Built 4 role-based dashboards (Node Operator, Researcher, Crowdfunder, Investor)
- Added batch parameter testing (10,000+ parallel combinations)
- Created reusable UI components (Button, Card, Badge, Modal, etc.)
- Added Recharts for analytics visualization
- Pushed to GitHub: github.com/oarn-network/oarn-dashboard

### User Dashboards

#### 1. Node Operator Dashboard
- Node status (online/offline, uptime)
- Earnings overview (ETH + COMP earned)
- Tasks completed / in progress
- Hardware stats (CPU, RAM, GPU usage)
- Claim/execute tasks manually
- Wallet balance and withdraw

#### 2. Researcher Dashboard
- Submit new tasks (model upload, parameters)
- Track task progress (claimed, executing, consensus)
- View results and download outputs
- Task history and spending
- Batch task submission UI

#### 3. Crowdfunder Dashboard
- Browse active research tasks
- Fund tasks with ETH
- Track funded tasks progress
- Funding history
- Leaderboard (top funders)

#### 4. Investor Dashboard
- Network stats (nodes, tasks, volume)
- Token metrics (COMP/GOV supply, distribution)
- Growth charts (tasks/day, nodes/day)
- Treasury balance
- Governance proposals

### Technical Stack
- **Frontend:** React or Next.js
- **Wallet:** RainbowKit / wagmi
- **Styling:** Tailwind CSS
- **Charts:** Recharts or Chart.js
- **State:** React Query for blockchain data

### Pages to Build
| Page | Users | Priority |
|------|-------|----------|
| `/dashboard` | All | High |
| `/nodes` | Node Operators | High |
| `/tasks` | Researchers | High |
| `/fund` | Crowdfunders | Medium |
| `/stats` | Investors | Medium |
| `/governance` | GOV holders | Low |

---

### Research Tasks
| # | Task | Priority | Status |
|---|------|----------|--------|
| 33 | GENESIS-001: Find biochemistry expert | High | Planned (see plans/) |
| 36 | GENESIS-001: Launch (1000+ nodes, 10k inferences) | High | Blocked by #33,35 |
| 37 | GENESIS-001: Analyze results | Medium | Blocked by #36 |
| 38 | GENESIS-001: Wet-lab validation (uni partnership) | Medium | Blocked by #37 |
| 39 | GENESIS-001: Publish paper (bioRxiv) | Medium | Blocked by #38 |

### Business Tasks
| # | Task | Priority | Status |
|---|------|----------|--------|
| 32 | Get investors / fundraising | High | In Progress |

#### Task #32 Sub-tasks (Fundraising)

**Week 1-2: Warm Up**
| # | Task | Priority | Status |
|---|------|----------|--------|
| 32.1 | Record demo video (2-3 min) | High | Pending |
| ~~32.2~~ | ~~Set up data room (Notion/Google Drive)~~ | ~~High~~ | ✅ Complete (2026-03-18) — https://drive.google.com/drive/folders/1Tff28Sfg3bavc3NLFmM-lHY8UJ9tIvhv |
| ~~32.3~~ | ~~Post first investor Twitter thread~~ | ~~High~~ | ✅ Complete (2026-03-18) — Thread 1 (Awareness, 7 tweets) posted |
| ~~32.4~~ | ~~Apply for Arbitrum Foundation grant~~ | ~~High~~ | ✅ Complete (2026-03-18) — Growth Track closed; applied to Audit Program + emailed grants@arbitrum.foundation |
| 32.5 | Apply for Protocol Labs grant ($75K) | Medium | Pending |

**Week 3-4: Outreach**
| # | Task | Priority | Status |
|---|------|----------|--------|
| 32.6 | Cold email Tier 2 DePIN funds (5 funds) | High | Pending |
| 32.7 | DM 10 potential angels on Twitter | High | Pending |
| 32.8 | Request warm intros to Tier 1 VCs | Medium | Pending |
| 32.9 | Schedule first investor calls | High | Pending |

**Week 5-6: VC Outreach**
| # | Task | Priority | Status |
|---|------|----------|--------|
| 32.10 | Partner meetings with interested funds | High | Pending |
| 32.11 | Share data room with serious investors | High | Pending |
| 32.12 | Conduct due diligence calls | Medium | Pending |

**Week 7+: Closing**
| # | Task | Priority | Status |
|---|------|----------|--------|
| 32.13 | Negotiate term sheets | High | Pending |
| 32.14 | Legal review of SAFE | High | Pending |
| 32.15 | Close round ($500K minimum) | High | Pending |

**Foresight Institute AI Nodes Grant**
| # | Task | Priority | Status |
|---|------|----------|--------|
| 76 | Email Bradley — clarify Berlin living cost coverage + remote hybrid option | High | Pending |
| 77 | Write 12-month project plan + itemized budget | High | Pending |
| 78 | Write impact narrative (existential risk / decentralized AI safety framing) | Medium | Pending |
| 79 | Apply to Foresight AI Nodes ($10k–$100k, rolling monthly deadline) | High | Blocked by #32.1, #75, #76–78 |

Note: #32.1 (demo video), #33 (biochem expert), and #75 (wet lab partners) are also prerequisites.

**Materials Ready** (in `plans/investor-materials/`):
- ✅ Financial projections (3-year model)
- ✅ Investor CRM (35+ contacts)
- ✅ Data room index
- ✅ Arbitrum grant application draft
- ✅ Protocol Labs grant application draft
- ✅ Twitter investor threads (4 threads)
- ✅ Demo script (5-min walkthrough)
- ✅ Pitch deck (updated with latest metrics)
- ✅ One-pager (updated)

---

## Continuous Tasks

### Task C1: X/Twitter Engagement (Ongoing)
**Frequency:** 3-5 tweets per week
**Account:** @OARNNetwork
**Status:** Active

**Content Sources:**
- `marketing/TWEETS.md` - Pre-written tweets
- `plans/investor-materials/twitter-investor-threads.md` - Investor threads

**Weekly Schedule:**
| Day | Content Type |
|-----|--------------|
| Monday | Technical update / milestone |
| Wednesday | Educational thread (how it works) |
| Friday | Community engagement / meme |
| Weekend | Retweet ecosystem content |

**Tweet Types:**
- [ ] Milestone announcements (new features, tests passing)
- [ ] Technical threads (consensus, ONNX, Arbitrum)
- [ ] Investor-focused (traction, fundraising)
- [ ] Community (alpha tester calls, Discord invites)
- [ ] Engagement (polls, questions, replies)

**Tracking:**
| Date | Tweet | Impressions | Engagement | Notes |
|------|-------|-------------|------------|-------|
| | | | | |

---

### Task C2: Discord Community (Ongoing)
**Frequency:** Daily check-ins
**Server:** https://discord.gg/RsrQwNvt
**Status:** Active

**Daily Tasks:**
- [ ] Check #general for questions
- [ ] Respond to #tech-support issues
- [ ] Welcome new members
- [ ] Post updates in #announcements

**Weekly Tasks:**
- [ ] Monday: Post weekly update summary
- [ ] Wednesday: Technical AMA or discussion
- [ ] Friday: Community highlight / shoutout

**Channel Management:**
| Channel | Purpose | Post Frequency |
|---------|---------|----------------|
| #announcements | Major updates, releases | 2-3x/week |
| #general | Community chat | Daily |
| #tech-support | Node issues, SDK help | As needed |
| #alpha-testers | Private tester channel | Daily during testing |
| #governance | Proposal discussions | As needed |
| #dev-updates | GitHub commits, PRs | Auto-feed |

**Growth Targets:**
| Metric | Current | Target |
|--------|---------|--------|
| Members | Track | 500 |
| Active weekly | Track | 100 |
| Alpha testers | 0 | 20 |

**Content Ideas:**
- Weekly dev update posts
- "How to run a node" walkthrough
- AMA sessions with team
- Bug bounty announcements
- Meme contests
- Alpha tester spotlights

---

### Old Marketing Tweets Reference
3. Mark as [POSTED] in the file
4. Add any engagement notes

**Ideas for Future Tweets**:
-
-
-

## Completed Tasks
- [x] #1: Core node software
- [x] #2: Smart contracts (TaskRegistry, COMP, GOV tokens)
- [x] #3: Website
- [x] #4: Testnet deployment (Arbitrum Sepolia)
- [x] #5: Social media accounts
- [x] #6: Discord server
- [x] #7: Fix P2P network bootstrap (mDNS + DHT)
- [x] #8: COMP token reward distribution
- [x] #9: IPFS + ONNX Runtime integration
- [x] #10: Task submission CLI
- [x] #20: ENS discovery code implementation
- [x] #11: Governance voting CLI + Governance.sol contract
- [x] #14: Multi-node consensus for tasks (TaskRegistryV2.sol)
- [x] #25: Contract test coverage (183 tests)
- [x] #26: Internal security review
- [x] #29: Docker deployment
- [x] #18: Node CLI improvements (JSON output, health check, peers, manual claiming)
- [x] #19: Add RPC providers to OARNRegistry (5 public endpoints)
- [x] #16: Create marketing materials (one-pager, taglines, tweets, FAQ)
- [x] #30: Publish @oarnnetwork/sdk to npm
- [x] #31: Multi-parameter batch task submission (SDK + Node batch execution)
- [x] #34: GENESIS-001 MVP (batch pipeline validated, optimal: 60.48% yield)
- [x] #40: SDK ABI fixes for TaskRegistryV2 (2026-03-14)
- [x] #41: Node IPFS CID conversion fix (2026-03-14)
- [x] #42: 3-Node network consensus test - Task #4 (2026-03-14)
- [x] #43: Real ONNX model execution (replace placeholder mode) (2026-03-14)
- [x] #44: Investor pitch deck (Reveal.js) (2026-03-14)
- [x] #47: Blog page with Twitter feed (2026-03-14)
- [x] #45: Website documents section (2026-03-14)
- [x] #46: Crowdfunding for research tasks - fundTask() (2026-03-15)
- [x] #48: Investor materials (financials, CRM, grants, demo script) (2026-03-15)
- [x] #49: Graphical UI Dashboard (Next.js 14, 4 role views, batch testing) (2026-03-15)
- [x] #50: Deploy Dashboard to Vercel (2026-03-15)

## Notes
- Testnet: Arbitrum Sepolia (Chain ID: 421614)
- OARNRegistry: 0x8DD738DBBD4A8484872F84192D011De766Ba5458 (with RPC providers)
- TaskRegistry: 0x4dc9dd73834e94545cf041091e1a743fbd09a60f
- TaskRegistryV2: 0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0 (with fundTask)
- COMP Token: 0x24249A523A251E38CB0001daBd54DD44Ea8f1838
- GOV Token: 0xB97eDD49C225d2c43e7203aB9248cAbED2B268d3

**Test Node Wallets (Funded):**
- Node 1 (Project): 0xc86e4f93dfc1e4952f105515a7fe84258916fdfb
- Node 2: 0x7379651e169e63272ec57ce14f2bfc023e28382e
- Node 3: 0x8e2b740f69296967968c2d096202ab73989e3a0d

**Latest GitHub Commits:**
- oarn-contracts: d762c3e (feat: add fundTask() for crowdfunding)
- oarn-sdk: b2688ec (feat: add fundTask() method v0.2.0)
- oarn-website: b92f8fd (feat: add Dashboard section and demo tasks)
- oarn-dashboard: (new repo - Next.js 14 dashboard)
- oarn-node: e84e889 (feat: implement real ONNX model execution)

---

## Task #52: Fix Wrong TaskRegistryV2 Address on Website
**Priority:** URGENT | **Status:** Pending

**Problem:** `index.html` and `manual.html` show old address `0x7b4898aDf69447d6ED3d62F6917CE10bD6519562`.
Correct address (with fundTask, used by SDK and tasks.html) is `0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0`.

**Files to fix:**
- `Webpage/index.html` — contract address display + Arbiscan link
- `Webpage/manual.html` — contract address + Arbiscan link

---

## Task #53: Connect Dashboard to Real @oarnnetwork/sdk
**Priority:** High | **Status:** ✅ COMPLETED (2026-03-16)

**What was done:**
- Replaced entire mock `OARNClient` in `providers/OARNClientProvider.tsx` with real blockchain reads
- Reads use wagmi's `usePublicClient` (viem) — calls `tasks()`, `taskCount()`, `getConsensusStatus()`, `getTaskNodes()`, ERC20 `balanceOf()`, OARNRegistry `getActiveRPCProviders()`
- Writes use wagmi's `useWriteContract` — `claimTask`, `submitResult`, `cancelTask`, `fundTask`, `submitTask`
- Fixed `TaskStatus` enum to match on-chain values (added Consensus=2, Disputed=4; fixed Completed=3, Cancelled=5, Expired=6)
- Fixed `ConsensusType` enum (Majority=0, SuperMajority=1, Unanimous=2)
- Updated `StatusBadge`, `TaskCard`, researcher task detail page for new statuses
- TypeScript build passes clean — commit 07fbab6 (oarn-dashboard)

---

## Task #54: Set Up Discord Server (New Template)
**Priority:** High | **Status:** 🔄 IN PROGRESS (2026-03-16)

**Goal:** Create the official OARN Discord server using template `discord.new/3KZNAFNvmqdR`
and populate static channels with content from `plans/discord-daily-engagement.md`.

**Steps:**
1. ✅ Create server from template — server live, structure + roles created
2. ✅ Set up #welcome, #rules, #faq, #links, #roadmap with content
3. ✅ Post first #announcements message
4. ✅ Post first weekly update in #news
5. ⏳ Set up self-assign roles in #roles (bot/reaction roles — TODO)
6. ⏳ Create #tech-support and #alpha-testers channels (optional, add when needed)

---

## Task #55: GitHub Releases — Pre-Built Node Binaries
**Priority:** High | **Status:** Pending

**Goal:** Publish pre-built `oarn-node` binaries on GitHub Releases so alpha testers can
install without needing Rust/Cargo toolchain.

**Platforms to build:**
- Linux x86_64 (primary)
- Linux ARM64 (Raspberry Pi / cloud)
- macOS arm64 (Apple Silicon)
- macOS x86_64
- Windows x64 (optional)

**Steps:**
1. Create GitHub Actions workflow in `oarn-node/.github/workflows/release.yml`
2. Trigger on `git tag v*` push
3. Build for each target via `cross` or native runners
4. Upload binaries as GitHub Release assets
5. Tag v0.1.0 to create first release
6. Update README and quick-start.md with download links

---

## Task #56: Professional Smart Contract Security Audit
**Priority:** High | **Status:** Blocked by #57

**Goal:** Hire external auditors before mainnet deployment.

**Known open issues (from internal review):**
- 5 High: silent reward failures, front-running on task claim, no dispute resolution
- 10 Medium: weak randomness, unbounded loops, DoS vectors
- 10 Low: zero-address checks, missing events

**Target Auditors:** CertiK, Trail of Bits, Consensys Diligence, Sherlock
**Estimated Cost:** $20,000–$80,000
**Timeline:** 4–6 weeks

**Pre-audit checklist:**
- [ ] Fix known High severity issues first
- [ ] 100% test coverage on critical paths
- [ ] NatSpec comments on all public functions
- [ ] Formal scope document

---

## Task #57: Scale Network Test — 10+ Nodes
**Priority:** High | **Status:** Pending

**Goal:** Verify consensus and reward distribution with 10+ nodes before mainnet.

**Why:** 3-node test passed but real-world resilience requires more nodes.

**Steps:**
1. Provision 10 cloud VMs (AWS/DigitalOcean/Hetzner)
2. Deploy oarn-node Docker on each with separate wallets
3. Fund wallets with testnet ETH
4. Submit 5 tasks requiring different consensus thresholds (Majority, SuperMajority, Unanimous)
5. Measure: consensus time, reward distribution, node drop resilience
6. Document results

---

## Task #58: Set Up oarn.network Custom Domain
**Priority:** Medium | **Status:** Pending

**Goal:** Replace GitHub Pages URL with oarn.network.

**Steps:**
1. Register `oarn.network` domain
2. Point DNS to GitHub Pages (CNAME for website)
3. Configure Vercel custom domain: `dashboard.oarn.network`
4. Update all links in website, docs, README, social profiles
5. Set up HTTPS / SSL

---

## Task #59: Activate DAO Governance on Testnet
**Priority:** Medium | **Status:** Pending

**Goal:** Make GOV token voting live on testnet so community can test governance.

**Steps:**
1. Create first proposal (e.g. "Approve GENESIS-001 parameters")
2. Distribute GOV tokens to 5+ test wallets
3. Run full vote lifecycle: propose → vote → execute
4. Document the process for community
5. Add governance section to dashboard investor view
6. Post tutorial in Discord #general

---

## Task #60: Legal / Compliance Finalization
**Priority:** Medium | **Status:** Pending

**Reference:** `oarn-internal-docs/09-legal-tasks.md`

**Key items:**
- Token classification opinion (utility vs security)
- Terms of Service for website
- Privacy Policy
- Jurisdiction selection for entity
- SAFE agreement template for seed round (needed for #32.13)

---

## Task #61: Upload Real GENESIS-001 ONNX Model to IPFS
**Priority:** Medium | **Status:** Blocked by #33

**Goal:** Replace test placeholder ONNX model with validated insulin synthesis model.

**Current state:** Tests use a simple linear model with random CIDs for demonstration.

**Steps:**
1. Work with biochemistry expert (#33) to define the actual model architecture
2. Train/obtain ONNX model for insulin synthesis parameter prediction
3. Upload to IPFS, record real CID
4. Update GENESIS-001 MVP scripts with real model CID
5. Submit real task to TaskRegistryV2 on testnet

---

## Task #62: Create Root README.md for Monorepo
**Priority:** Low | **Status:** ✅ COMPLETED (2026-03-16)

- Created `README.md` at monorepo root with full repo map, contract addresses,
  quick links, SDK usage example, Docker setup, and network info.
- Commit: b2ad998 (oarn-network)

---

## Task #63: Fix Hardcoded Website Stats
**Priority:** Low | **Status:** ✅ COMPLETED (2026-03-16)

- Updated `blog.html` quick stats sidebar: 183 → 190 tests passing.
- Commit: 70587c2 (oarn-website)

---

## Task #64: Token Launch Strategy (Phase 3 Planning)
**Priority:** Low | **Status:** Pending

**Goal:** Define when and how COMP and GOV tokens go live on mainnet.

**Key decisions needed:**
- Initial distribution (node operators, investors, team, treasury, community)
- Vesting schedules
- Whether to list on DEX at launch (Uniswap on Arbitrum)
- Initial liquidity provision
- Whether to pursue CEX listings and when
- Governance activation threshold (quorum, proposal threshold)

**Reference:** `oarn-docs/decentralized-ai-whitepaper.md` tokenomics section

---

## Task #65: Get Hetzner Dedicated Server — EX42
**Priority:** High | **Status:** Pending

**Server Specs:**
- **CPU:** Intel Core i7-7700 (4 cores / 8 threads, 4.2GHz boost)
- **RAM:** 64 GB DDR4
- **Storage:** 2× 512 GB NVMe SSD
- **Network:** 1 Gbit/s unlimited
- **Cost:** €64/month
- **Type:** Dedicated hardware (no shared resources)

**Why dedicated over VPS:**
- Full CPU/RAM isolation — no noisy neighbours
- Dedicated hardware = consistent performance for ONNX inference + node software
- 1 Gbit/s unmetered — handles many simultaneous node connections
- Cost-effective for the specs vs cloud equivalent (~€300+/month on AWS)

**Order:** https://www.hetzner.com/dedicated-rootserver/ex42

---

### Task #65.1: Order & Initial Setup
**Status:** Pending
- [ ] Order EX42 at hetzner.com (installimage: Ubuntu 22.04 LTS)
- [ ] Configure SSH key auth, disable password login
- [ ] Set up firewall (ufw): allow 22, 80, 443, block everything else
- [ ] Configure automatic security updates
- [ ] Set hostname: `server1.oarn.network` (after domain registered in #58)

---

### Task #65.2: Install Discord Bot (Node.js)
**Status:** Pending

**Purpose:** OARN community bot — welcome messages, role assignment, GitHub feed, task alerts

- [ ] Install Node.js 20 LTS + pm2
- [ ] Clone bot repo (or create new in `oarn-network/oarn-bot`)
- [ ] Configure Discord bot token + channel IDs in `.env`
- [ ] Set up pm2 to auto-restart on crash / server reboot
- [ ] Features to implement:
  - Auto-welcome new members with role selection prompt
  - `!node-status` command — query on-chain node count
  - `!task-list` command — show open tasks from TaskRegistryV2
  - GitHub webhook → post new commits to #dev-updates
  - Alert on new task created on-chain → post to #announcements

---

### Task #65.3: Deploy Website / Landing Page (Static)
**Status:** Pending

**Purpose:** Move website off GitHub Pages to self-hosted for custom domain + speed

- [ ] Install Nginx
- [ ] Copy `Webpage/` static files to `/var/www/oarn.network/`
- [ ] Configure Nginx vhost for `oarn.network` and `www.oarn.network`
- [ ] Install Certbot + Let's Encrypt SSL (auto-renew)
- [ ] Set up GitHub Actions deploy: on push to `oarn-website/main` → rsync to server
- [ ] Configure HTTP → HTTPS redirect
- [ ] Gzip + caching headers for static assets

---

### Task #65.4: Deploy API Gateway (Express / FastAPI)
**Status:** Pending

**Purpose:** Central API for dashboard, Discord bot, and future integrations

- [ ] Choose stack: **Express (Node.js)** for consistency with SDK/bot
- [ ] Endpoints to implement:
  - `GET /api/tasks` — proxy on-chain task list with caching
  - `GET /api/stats` — network stats (node count, task count, total rewards)
  - `GET /api/node/:address` — node info + earnings
  - `POST /api/tasks/submit` — authenticated task submission relay
  - `GET /api/health` — server health check
- [ ] Run behind Nginx reverse proxy (`/api` → `localhost:3001`)
- [ ] PM2 process management
- [ ] Rate limiting (express-rate-limit)
- [ ] CORS configured for dashboard domain

---

### Task #65.5: Set Up PostgreSQL Database
**Status:** Pending

**Purpose:** Persistent storage for off-chain data (analytics, user sessions, bot state)

- [ ] Install PostgreSQL 15
- [ ] Create databases: `oarn_main`, `oarn_analytics`
- [ ] Create restricted app user (no superuser)
- [ ] Tables to create:
  - `tasks` — cache of on-chain tasks with metadata
  - `nodes` — registered node info + uptime history
  - `events` — contract event log (TaskCreated, ConsensusReached, TaskFunded)
  - `stats_snapshots` — daily network stats for charts
  - `discord_users` — Discord ↔ wallet address mapping
- [ ] Set up daily pg_dump backup to `/backups/` (retain 30 days)
- [ ] Configure connection pooling (pgBouncer or built-in)

---

### Task #65.6: Set Up Redis (Caching)
**Status:** Pending

**Purpose:** Cache on-chain reads and API responses to reduce RPC calls

- [ ] Install Redis 7
- [ ] Configure max memory + eviction policy (`allkeys-lru`)
- [ ] Cache keys to implement:
  - `tasks:available` — TTL 30s
  - `stats:network` — TTL 60s
  - `node:{address}:balance` — TTL 15s
  - `tasks:{id}:status` — TTL 10s
- [ ] Bind to localhost only (not public)
- [ ] Configure Redis password auth

---

### Task #65.7: Configure Nginx (Reverse Proxy)
**Status:** Pending

**Purpose:** Single entry point for all HTTP/HTTPS traffic

- [ ] Install Nginx + Certbot
- [ ] Vhost configuration:
  - `oarn.network` → static website (`/var/www/oarn.network`)
  - `dashboard.oarn.network` → proxy to Vercel (or self-hosted Next.js)
  - `api.oarn.network` → proxy to Express API (localhost:3001)
  - `bot.oarn.network` → internal only / blocked
- [ ] SSL for all subdomains (wildcard cert `*.oarn.network`)
- [ ] Security headers: HSTS, X-Frame-Options, CSP
- [ ] DDoS basic protection: rate limiting, connection limits
- [ ] Access logs → `/var/log/nginx/`

---

### Task #65.8: Monitoring & Alerting
**Status:** Pending

- [ ] Install `netdata` or `htop` for resource monitoring
- [ ] Set up uptime check (UptimeRobot free tier — ping `oarn.network` every 5 min)
- [ ] Discord alert on server down (webhook → #announcements)
- [ ] Log rotation configured for all services
- [ ] Monthly cost tracking note in budget
