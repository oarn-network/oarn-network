# OARN Network

**Open AI Research Network** — decentralized AI compute infrastructure for open science.

Anyone can run a node, earn rewards for executing AI inference tasks, and contribute to real research.

> **Status:** Testnet live on Arbitrum Sepolia · First research task: GENESIS-001 (insulin synthesis optimization)

---

## Quick Links

| Resource | URL |
|----------|-----|
| Website | https://oarn-network.github.io/oarn-website/ |
| Dashboard | https://oarn-dashboard.vercel.app/ |
| SDK (npm) | https://www.npmjs.com/package/@oarnnetwork/sdk |
| Discord | https://discord.gg/RsrQwNvt |
| Twitter | https://twitter.com/OARNNetwork |

---

## Repository Structure

```
oarn-network/
├── oarn-node/          Rust node software — runs inference tasks, earns COMP rewards
├── oarn-contracts/     Solidity smart contracts — TaskRegistryV2, COMP, GOV tokens
├── oarn-sdk/           TypeScript/JavaScript SDK for interacting with the network
├── oarn-dashboard/     Next.js 14 web dashboard — 4 role-based views
├── oarn-docs/          Public documentation and whitepaper
├── Webpage/            Static website (GitHub Pages)
└── docker-compose.yml  Run multiple nodes locally with Docker
```

---

## Repositories

### [oarn-node](https://github.com/oarn-network/oarn-node)
Rust implementation of the OARN node. Handles P2P networking (libp2p), IPFS model retrieval, ONNX inference, and on-chain result submission.

```bash
# Download pre-built binary (Linux)
tar -xzf oarn-node-*-x86_64-unknown-linux-gnu.tar.gz
./oarn-node config init
./oarn-node start

# Or with Docker
docker run -d -v ~/.oarn:/root/.oarn ghcr.io/oarn-network/oarn-node:latest start
```

→ [Releases](https://github.com/oarn-network/oarn-node/releases) · [Setup guide](https://oarn-network.github.io/oarn-website/manual.html)

---

### [oarn-contracts](https://github.com/oarn-network/oarn-contracts)
Solidity smart contracts deployed on Arbitrum Sepolia.

| Contract | Address |
|----------|---------|
| TaskRegistryV2 | `0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0` |
| OARNRegistry | `0xa122518Cb6E66A804fc37EB26c8a7aF309dCF04C` |
| COMP Token | `0x24249A523A251E38CB0001daBd54DD44Ea8f1838` |
| GOV Token | `0xB97eDD49C225d2c43e7203aB9248cAbED2B268d3` |

→ [Arbiscan](https://sepolia.arbiscan.io/address/0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0)

---

### [oarn-sdk](https://github.com/oarn-network/oarn-sdk)
TypeScript SDK. Submit tasks, query results, manage tokens.

```bash
npm install @oarnnetwork/sdk
```

```ts
import { OARNClient } from '@oarnnetwork/sdk';

const client = new OARNClient({ rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc' });
const tasks = await client.getTasks();
```

→ [npm](https://www.npmjs.com/package/@oarnnetwork/sdk) · [API reference](https://github.com/oarn-network/oarn-docs/blob/main/api-reference.md)

---

### [oarn-dashboard](https://github.com/oarn-network/oarn-dashboard)
Next.js 14 web dashboard with RainbowKit wallet integration. Four role-based views:
- **Node Operator** — claim tasks, monitor earnings
- **Researcher** — submit AI inference tasks, batch parameter testing
- **Crowdfunder** — fund research tasks
- **Investor** — analytics, governance voting

→ [Live Dashboard](https://oarn-dashboard.vercel.app/)

---

### [oarn-docs](https://github.com/oarn-network/oarn-docs)
Whitepaper, API reference, and contributing guidelines.

---

## Running Locally (Docker)

```bash
git clone https://github.com/oarn-network/oarn-network
cd oarn-network
cp config/node1.example.toml config/node1.toml  # add your private key + RPC URL
docker-compose up
```

See [DOCKER.md](./DOCKER.md) for full multi-node setup instructions.

---

## Network

- **Chain:** Arbitrum Sepolia (testnet, Chain ID: 421614)
- **Testnet ETH faucet:** https://faucet.triangleplatform.com/arbitrum/sepolia
- **Consensus:** 3+ nodes must submit identical result hashes
- **Rewards:** COMP tokens + ETH per completed task

---

## License

MIT — see individual repository LICENSE files.
