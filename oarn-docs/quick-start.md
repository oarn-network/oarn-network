# OARN Network — Quick Start

## Overview

OARN (Open AI Research Network) is a decentralized compute protocol on Arbitrum that lets researchers run AI inference tasks across a network of node operators with on-chain consensus verification.

---

## For Researchers

### 1. Connect your wallet to the dashboard

**Live dashboard:** https://oarn-dashboard.vercel.app/

- Connect a MetaMask or WalletConnect-compatible wallet
- Switch to **Arbitrum Sepolia** (Chain ID: 421614)
- Select the **Researcher** role

### 2. Submit a task

1. Prepare your model file (`.onnx`, `.pt`, `.pth`, `.h5`, `.pb`) and input data (`.json`, `.npy`, `.npz`)
2. Navigate to **Submit Task** in the dashboard
3. Set reward per node (minimum 0.001 ETH), number of nodes (minimum 3), and deadline
4. Choose consensus type: Majority (>50%), Super Majority (>66%), or Unanimous
5. Submit — your ETH is held in the contract until consensus is reached

### 3. Retrieve results

Once the required number of nodes submit matching result hashes, consensus is reached and rewards are distributed automatically. View your task status and result hash under **My Tasks**.

---

## For Node Operators

### Prerequisites

- Docker 24+ or Rust 1.75+ toolchain
- A funded Arbitrum Sepolia wallet (for gas)
- At least 4 GB RAM; GPU optional (CUDA / ROCm supported)

### Option A — Docker (recommended)

```bash
docker pull ghcr.io/oarn-network/oarn-node:latest

docker run -d \
  --name oarn-node \
  -e PRIVATE_KEY=<your_private_key> \
  -e RPC_URL=https://sepolia-rollup.arbitrum.io/rpc \
  ghcr.io/oarn-network/oarn-node:latest
```

### Option B — Build from source

```bash
git clone https://github.com/oarn-network/oarn-network.git
cd oarn-network/oarn-node

# CPU only
cargo build --release --features compute

# With CUDA GPU support
cargo build --release --features compute,cuda
```

Configure `config/node.toml` with your private key and RPC URL, then:

```bash
./target/release/oarn-node
```

### Monitor your node

Node performance, earnings, and task history are visible on the dashboard under **Node Operator → Stats**.

---

## For Developers — SDK

```bash
npm install @oarnnetwork/sdk
```

```typescript
import { OARNClient } from '@oarnnetwork/sdk';

const client = new OARNClient({
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
});

// Submit a task
const taskId = await client.submitTask({
  modelPath: './model.onnx',
  inputPath: './input.json',
  rewardPerNode: 0.01,   // ETH
  requiredNodes: 3,
  deadlineHours: 24,
});

console.log('Task submitted:', taskId);
```

Full SDK reference: https://www.npmjs.com/package/@oarnnetwork/sdk

---

## Contract Addresses (Arbitrum Sepolia — Chain ID 421614)

| Contract | Address |
|----------|---------|
| TaskRegistryV2 | `0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0` |
| OARNRegistry | `0xa122518Cb6E66A804fc37EB26c8a7aF309dCF04C` |
| COMP Token | `0x24249A523A251E38CB0001daBd54DD44Ea8f1838` |
| GOV Token | `0xB97eDD49C225d2c43e7203aB9248cAbED2B268d3` |
| OARNGovernance | `0x56D2826FF4FaEF8d4Db54eF11e86d0421fc2893B` |
| WetLabOracle | `0xF8991A56cB5B9073a3eEC87E95Dfb055fdDF0094` |

All contracts verified on [Arbiscan (Sepolia)](https://sepolia.arbiscan.io/).

---

## Useful Links

| Resource | URL |
|----------|-----|
| Dashboard | https://oarn-dashboard.vercel.app/ |
| GitHub | https://github.com/oarn-network |
| Discord | https://discord.gg/RsrQwNvt |
| Telegram | https://t.me/OARNNetwork |
| Twitter | https://twitter.com/OARNNetwork |
| Testnet Faucet (Arbitrum Sepolia) | https://faucet.triangleplatform.com/arbitrum/sepolia |
