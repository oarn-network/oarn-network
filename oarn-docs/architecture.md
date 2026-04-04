# OARN Network — Closed-Loop Architecture

OARN combines decentralized AI compute, on-chain consensus verification, and physical wet lab validation into a self-improving discovery loop. This document describes how the layers interact.

---

## System Overview

```
Researcher submits task
        │
        ▼
┌───────────────────┐
│  TaskRegistryV2   │  Holds ETH reward, records model/input hashes
└────────┬──────────┘
         │  TaskCreated event
         ▼
┌───────────────────┐
│   oarn-node (N)   │  Node operators claim task, run inference,
│   Rust + ONNX/    │  submit result hash
│   PyTorch / TF    │
└────────┬──────────┘
         │  ResultSubmitted events
         ▼
┌───────────────────┐
│  Consensus Engine │  Majority / SuperMajority / Unanimous threshold
│  (on-chain)       │  Winning hash → rewards distributed
└────────┬──────────┘
         │  consensusResult
         ▼
┌───────────────────┐
│   WetLabOracle    │  Certified labs submit measured values
│   (optional)      │  On-chain consensus of physical results
└────────┬──────────┘
         │  verified result anchored on-chain
         ▼
  Next iteration (Continuous Task Mode)
```

---

## Components

### TaskRegistryV2

The core coordination contract. Manages the full task lifecycle.

**Key features:**
- Multi-node consensus: 3–100 nodes per task
- Three consensus modes: `Majority` (>50%), `SuperMajority` (>66%), `Unanimous`
- Checks-Effects-Interactions pattern — rewards distributed only after consensus
- `fundTask()` — any address can top up a task's reward pool mid-flight
- **Continuous Task Mode** — `submitTaskContinuous()` creates a recurring series of tasks with a `maxRounds` cap and a `maxSpendWei` hard cap. Call `triggerNextRound(parentTaskId)` after each round completes.

**Deployed (Arbitrum Sepolia):** `0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0`

---

### oarn-node

Rust daemon that watches the chain, claims tasks, runs inference, and submits result hashes.

**Inference stack:**
- ONNX Runtime (`ort` 2.0) — primary execution path for `.onnx` models
- PyTorch subprocess (`torch.jit.load`) — for `.pt` / `.pth` TorchScript models
- TensorFlow subprocess (`tf.saved_model.load`) — for SavedModel / `.h5` / `.pb` models
- GPU auto-detection: probes `nvidia-smi` (CUDA) then `rocm-smi` (ROCm); falls back to CPU
- Cargo features: `--features compute` (CPU), `--features compute,cuda`, `--features compute,rocm`

**Networking:**
- WebSocket subscription to `TaskCreated` / `ResultSubmitted` / `ConsensusReached` events with exponential backoff reconnect (2s → 64s cap)
- HTTP polling fallback when WS is not active
- DHT peer discovery via libp2p Kademlia with IPFS bootstrap fallback

---

### WetLabOracle

Records physically verified results on-chain. Bridges computational predictions with real-world measurements.

**Flow:**
1. Owner certifies lab addresses (`certifyLab`)
2. Certified labs call `submitResult(taskId, parametersHash, measuredValue, metric)`
3. When `requiredConfirmations` labs agree, consensus is stored on-chain
4. Labs claim GOV token rewards via pull-based `claimReward()`

**Security controls:**
- `MAX_SUBMITTERS_PER_TASK = 50` — caps O(n²) consensus loop
- `MAX_METRIC_LENGTH = 64` — prevents calldata bloat
- Pool balance check before crediting rewards — prevents overdraft
- `totalPendingRewards` tracker — owner can only withdraw unallocated GOV
- `nonReentrant` on all state-changing external calls

**Deployed (Arbitrum Sepolia):** `0xF8991A56cB5B9073a3eEC87E95Dfb055fdDF0094`

---

### OARNRegistry

Registry for RPC infrastructure providers (not compute nodes). Compute node participation is derived from `TaskClaimed` / `RewardDistributed` events on TaskRegistryV2.

**Deployed (Arbitrum Sepolia):** `0xa122518Cb6E66A804fc37EB26c8a7aF309dCF04C`

---

### OARNGovernance

OpenZeppelin Governor-based DAO for on-chain governance. GOV token holders vote on protocol parameter changes.

**Deployed (Arbitrum Sepolia):** `0x56D2826FF4FaEF8d4Db54eF11e86d0421fc2893B`

---

## Token Model

| Token | Symbol | Purpose |
|-------|--------|---------|
| Compute Token | COMP | Node operator payment for completed tasks |
| Governance Token | GOV | Governance voting, testnet rewards at TGE, WetLabOracle lab rewards |

- **COMP** is earned by nodes that match the consensus result hash
- **GOV** is distributed to certified wet labs via WetLabOracle and to early contributors

**COMP Token (Arbitrum Sepolia):** `0x24249A523A251E38CB0001daBd54DD44Ea8f1838`  
**GOV Token (Arbitrum Sepolia):** `0xB97eDD49C225d2c43e7203aB9248cAbED2B268d3`

---

## Continuous Task Mode

Researchers can submit a task series with a single `submitTaskContinuous()` call. This is designed for parameter sweeps and iterative refinement loops (e.g. GENESIS-001 insulin synthesis optimization).

```
Round 1: submitTaskContinuous(modelHash, ..., maxRounds=10, maxSpendWei=1 ETH)
         → parentTaskId = 42

Round 2: triggerNextRound(42)   ← called after round 1 reaches Completed
         → newTaskId = 43, emits ContinuousTaskTriggered(42, 43, round=2)

...

Round 10: triggerNextRound(42)  ← last allowed round
          (further calls revert: "Max rounds reached")
```

Each round reuses the same model hash, input hash, node count, and reward. The `maxSpendWei` cap is enforced at each trigger. Call `stopContinuousTask(parentTaskId)` to halt early.

---

## All Deployed Addresses (Arbitrum Sepolia — Chain ID 421614)

| Contract | Address | Deployed |
|----------|---------|----------|
| COMPToken | `0x24249A523A251E38CB0001daBd54DD44Ea8f1838` | 2026-03-14 |
| GOVToken | `0xB97eDD49C225d2c43e7203aB9248cAbED2B268d3` | 2026-03-14 |
| TaskRegistry (v1) | `0x4Dc9dD73834E94545cF041091e1A743FBD09a60f` | 2026-03-14 |
| OARNRegistry | `0xa122518Cb6E66A804fc37EB26c8a7aF309dCF04C` | 2026-03-14 |
| TaskRegistryV2 | `0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0` | 2026-03-14 |
| OARNGovernance | `0x56D2826FF4FaEF8d4Db54eF11e86d0421fc2893B` | 2026-03-16 |
| WetLabOracle | `0xF8991A56cB5B9073a3eEC87E95Dfb055fdDF0094` | 2026-03-21 |

All contracts are verified on [Arbiscan (Sepolia)](https://sepolia.arbiscan.io/).
