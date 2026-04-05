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
3. Set reward per node (minimum 0.001 ETH), number of nodes (minimum 3), and deadline (default: 72 hours)
4. Choose consensus type: Majority (>50%), Super Majority (>66%), or Unanimous
5. Submit — your ETH is held in the contract until consensus is reached

### 3. Retrieve results

Once the required number of nodes submit matching result hashes, consensus is reached and rewards are distributed automatically. View your task status and result hash under **My Tasks**.

---

## For Node Operators

### Step 1 — Prerequisites

- **Docker 24+** (recommended) OR **Rust 1.75+** toolchain
- A funded **Arbitrum Sepolia** wallet (ETH for gas — use the faucet link below)
- At least **4 GB RAM**; GPU optional (CUDA 11+ / ROCm 5+ supported)

### Step 2 — Install Docker (if using Docker)

**Ubuntu / Debian:**
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER   # log out and back in after this
```

**Mac:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Step 3 — Create configuration file

Create `~/.oarn/config.toml`:

```bash
mkdir -p ~/.oarn
```

Paste this content into `~/.oarn/config.toml`:

```toml
mode = "standard"

[network]
listen_addresses = ["/ip4/0.0.0.0/tcp/4001"]
max_peers = 50

[network.discovery]
method = "manual"
manual_bootstrap = []

[blockchain]
chain_id = 421614
rpc_discovery = "manual"
manual_rpc_url = "https://sepolia-rollup.arbitrum.io/rpc"

[blockchain.contracts]
task_registry_v2 = "0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0"
oarn_registry    = "0xa122518Cb6E66A804fc37EB26c8a7aF309dCF04C"
token_reward     = "0x24249A523A251E38CB0001daBd54DD44Ea8f1838"
gov_token        = "0xB97eDD49C225d2c43e7203aB9248cAbED2B268d3"

[storage]
ipfs_api = "http://ipfs:5001"
cache_dir = "/data/cache"
max_cache_mb = 5000

[compute]
max_ram_mb = 8192
frameworks = ["onnx"]
concurrent_tasks = 1

[privacy]
tor_enabled = false
```

> **Private key:** Never put your private key in the config file. Pass it via environment variable (see Step 4).

### Step 4 — Set your private key

Export your wallet private key as an environment variable. To make it permanent, add this line to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export OARN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

Then reload your shell:
```bash
source ~/.bashrc   # or source ~/.zshrc
```

### Step 5 — Run the node

**Docker (recommended):**

```bash
docker pull ghcr.io/oarn-network/oarn-node:latest

docker run -d \
  --name oarn-node \
  --restart unless-stopped \
  -e OARN_PRIVATE_KEY=$OARN_PRIVATE_KEY \
  -v ~/.oarn/config.toml:/app/config.toml \
  -v ~/.oarn/data:/data \
  -p 4001:4001 \
  ghcr.io/oarn-network/oarn-node:latest
```

Check logs:
```bash
docker logs -f oarn-node
```

**Binary (alternative):**

Download the latest release from [GitHub Releases](https://github.com/oarn-network/oarn-network/releases), then:

```bash
tar xzf oarn-node-linux-x86_64.tar.gz
chmod +x oarn-node
sudo mv oarn-node /usr/local/bin/

oarn-node --config ~/.oarn/config.toml start
```

**Build from source:**

```bash
git clone https://github.com/oarn-network/oarn-network.git
cd oarn-network/oarn-node

# CPU only
cargo build --release --features compute

# With CUDA GPU support
cargo build --release --features compute,cuda

./target/release/oarn-node --config ~/.oarn/config.toml start
```

### Step 6 — Verify it's working

A healthy node start looks like this:

```
INFO oarn_node: Starting OARN Node v0.x.x
INFO oarn_node: Wallet address: 0xYourAddress
INFO oarn_node: Connected to Arbitrum Sepolia (chain 421614)
INFO oarn_node: Listening on /ip4/0.0.0.0/tcp/4001
INFO oarn_node: Node is running. Waiting for tasks...
```

**Common first-run messages (not errors):**

| Message | Meaning |
|---------|---------|
| `found 0 closest peers` | Peer discovery is warming up — does not affect task processing |
| `No available tasks found` | No tasks posted yet — node is idle and ready |

Check your node status on the dashboard under **Node Operator → Stats**.

---

## For Developers — SDK

```bash
npm install @oarnnetwork/sdk
```

```typescript
import { readFileSync } from 'fs';
import { parseEther } from 'viem';
import { OARNClient } from '@oarnnetwork/sdk';

const client = new OARNClient({
  privateKey: process.env.OARN_PRIVATE_KEY,
  rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
});

// Submit a task (uploads files to IPFS, then registers on-chain)
const { taskId, modelCid, inputCid } = await client.submitTaskWithData(
  readFileSync('./model.onnx'),
  readFileSync('./input.json'),
  parseEther('0.01'),          // reward per node in wei
  3,                           // required nodes
  Math.floor(Date.now() / 1000) + 72 * 3600,  // deadline (72 hours)
);

console.log('Task submitted:', taskId);
console.log('Model CID:', modelCid);
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
