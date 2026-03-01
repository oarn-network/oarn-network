# OARN Network - Docker Deployment

This guide explains how to run OARN Network nodes using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- At least 8GB RAM
- Ethereum wallet with some ETH on Arbitrum Sepolia (testnet)

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/oarn-network/oarn-network.git
cd oarn-network

# Copy environment template
cp .env.example .env
```

### 2. Set Your Private Key

Edit `.env` and add your wallet private key:

```
OARN_PRIVATE_KEY=0x...your_private_key_here...
```

**IMPORTANT**: Never commit your `.env` file or share your private key!

### 3. Start the Node

```bash
# Start IPFS and OARN node
docker-compose up -d

# View logs
docker-compose logs -f oarn-node
```

### 4. Check Status

```bash
# Check running containers
docker-compose ps

# Check node logs
docker-compose logs oarn-node

# Check IPFS logs
docker-compose logs ipfs
```

## Multi-Node Setup

For testing multi-node consensus, you can run multiple nodes:

### 1. Create Additional Configs

```bash
cp -r config config-node2
cp -r config config-node3
```

### 2. Set Additional Private Keys

Edit `.env`:

```
OARN_PRIVATE_KEY=0x...node1_key...
OARN_PRIVATE_KEY_2=0x...node2_key...
OARN_PRIVATE_KEY_3=0x...node3_key...
```

### 3. Start All Nodes

```bash
docker-compose --profile multi-node up -d
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OARN_PRIVATE_KEY` | Node 1 wallet private key | Required |
| `OARN_PRIVATE_KEY_2` | Node 2 wallet private key | Optional |
| `OARN_PRIVATE_KEY_3` | Node 3 wallet private key | Optional |
| `OARN_RPC_URL` | Arbitrum RPC endpoint | Arbitrum Sepolia |

### Ports

| Service | Port | Description |
|---------|------|-------------|
| IPFS | 4001 | P2P |
| IPFS | 5001 | API |
| IPFS | 8080 | Gateway |
| OARN Node 1 | 4002 | P2P |
| OARN Node 1 | 8081 | HTTP API |
| OARN Node 2 | 4003 | P2P |
| OARN Node 3 | 4004 | P2P |

### Volumes

Data is persisted in Docker volumes:

- `ipfs_data` - IPFS node data
- `oarn_data` - OARN node data and cache

## Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Rebuild after code changes
docker-compose build --no-cache

# Remove all data (fresh start)
docker-compose down -v

# Enter container shell
docker-compose exec oarn-node /bin/bash
```

## Mainnet Deployment

For mainnet (Arbitrum One):

1. Update `config/config.toml`:
   - Change `chain_id = 42161`
   - Update contract addresses to mainnet addresses

2. Update `.env`:
   ```
   OARN_RPC_URL=https://arb1.arbitrum.io/rpc
   ```

3. Ensure your wallet has ETH on Arbitrum One

## Troubleshooting

### Node not starting

```bash
# Check logs
docker-compose logs oarn-node

# Common issues:
# - Private key not set: Check .env file
# - IPFS not ready: Wait for IPFS to fully start
# - Config error: Check config/config.toml syntax
```

### IPFS connection failed

```bash
# Ensure IPFS is running
docker-compose ps ipfs

# Check IPFS health
docker-compose exec ipfs ipfs id
```

### Out of disk space

```bash
# Clean up old images
docker system prune -a

# Remove IPFS cache
docker-compose exec ipfs ipfs repo gc
```

## Building from Source

```bash
# Build node image
docker-compose build oarn-node

# Build with no cache (for code changes)
docker-compose build --no-cache oarn-node
```

## Security Notes

1. **Never commit `.env`** - It contains your private key
2. **Use dedicated wallets** - Don't use personal wallets for nodes
3. **Firewall rules** - Consider limiting port exposure in production
4. **Regular updates** - Pull latest images regularly

## Support

- GitHub Issues: https://github.com/oarn-network/oarn-network/issues
- Discord: https://discord.gg/oarn
- Docs: https://docs.oarn.network
