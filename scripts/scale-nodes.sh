#!/usr/bin/env bash
# =============================================================================
# OARN Network — Scale to 10 Nodes
#
# Run on the Hetzner server (144.76.58.152) as the florian user.
# Adds nodes 4–10, updates nodes 1–3 to point at TaskRegistryV2,
# and prints all wallet addresses that need Sepolia ETH funding.
#
# Usage:
#   cd /opt/projects/oarn-network
#   git pull
#   bash scripts/scale-nodes.sh
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[scale]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
info() { echo -e "${CYAN}[info]${NC} $1"; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="/opt/oarn/oarn-node"
OARN_DIR="/opt/oarn"

# ── Sanity checks ─────────────────────────────────────────────────────────────
[[ -f "$NODE_BIN" ]] || { echo "ERROR: oarn-node binary not found at $NODE_BIN"; exit 1; }
command -v pm2 &>/dev/null || { echo "ERROR: pm2 not found — install with: npm install -g pm2"; exit 1; }

# ── Step 1: Update node 1–3 configs (new TaskRegistryV2 address) ─────────────
log "Updating node 1–3 configs to new TaskRegistryV2..."
for i in 1 2 3; do
  src="${REPO_ROOT}/oarn-node/config-node${i}.toml"
  dst="${OARN_DIR}/node${i}/config.toml"
  if [[ -f "$src" ]] && [[ -f "$dst" ]]; then
    cp "$src" "$dst"
    log "  node${i}: config updated"
  elif [[ -f "$src" ]]; then
    mkdir -p "${OARN_DIR}/node${i}"
    cp "$src" "$dst"
    log "  node${i}: directory created + config installed"
  else
    warn "  node${i}: source config not found at $src — skipping"
  fi
done

# Restart nodes 1–3 so they pick up the new contract address
log "Restarting nodes 1–3..."
for i in 1 2 3; do
  if pm2 describe "oarn-node-${i}" &>/dev/null 2>&1; then
    pm2 restart "oarn-node-${i}"
    log "  oarn-node-${i} restarted"
  else
    warn "  oarn-node-${i} not found in PM2 — starting fresh"
    pm2 start "$NODE_BIN" \
      --name "oarn-node-${i}" \
      --interpreter none \
      -- --config "${OARN_DIR}/node${i}/config.toml"
    log "  oarn-node-${i} started"
  fi
done

# ── Step 2: Create node 4–10 directories and configs ─────────────────────────
log "Installing configs for nodes 4–10..."
for i in 4 5 6 7 8 9 10; do
  src="${REPO_ROOT}/oarn-node/config-node${i}.toml"
  dst_dir="${OARN_DIR}/node${i}"
  dst="${dst_dir}/config.toml"

  mkdir -p "$dst_dir"
  if [[ -f "$src" ]]; then
    cp "$src" "$dst"
    log "  node${i}: config installed at $dst"
  else
    warn "  node${i}: source config not found at $src — skipping"
    continue
  fi
done

# ── Step 3: Start nodes 4–10 in PM2 ─────────────────────────────────────────
log "Starting nodes 4–10 in PM2..."
for i in 4 5 6 7 8 9 10; do
  dst="${OARN_DIR}/node${i}/config.toml"
  [[ -f "$dst" ]] || { warn "  node${i}: config missing — skipped"; continue; }

  if pm2 describe "oarn-node-${i}" &>/dev/null 2>&1; then
    pm2 restart "oarn-node-${i}"
    log "  oarn-node-${i} restarted (was already registered)"
  else
    pm2 start "$NODE_BIN" \
      --name "oarn-node-${i}" \
      --interpreter none \
      -- --config "${OARN_DIR}/node${i}/config.toml"
    log "  oarn-node-${i} started"
  fi
done

# ── Step 4: Save PM2 state ───────────────────────────────────────────────────
pm2 save
log "PM2 state saved (processes will auto-restart on reboot)"

# ── Step 5: Print wallet addresses that need funding ─────────────────────────
echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  Wallet addresses — fund each with 0.05 Sepolia ETH${NC}"
echo -e "${CYAN}  (for gas when claiming tasks and submitting results)${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# Derive addresses from private keys stored in each node's config.toml
if command -v node &>/dev/null; then
  for i in 1 2 3 4 5 6 7 8 9 10; do
    cfg="${OARN_DIR}/node${i}/config.toml"
    if [[ -f "$cfg" ]]; then
      key=$(grep -E '^\s*private_key\s*=' "$cfg" | head -1 | sed 's/.*= *"\(.*\)"/\1/')
      if [[ -n "$key" ]]; then
        addr=$(node -e "const {ethers}=require('ethers');console.log(new ethers.Wallet('${key}').address);" 2>/dev/null || echo "(derive failed)")
        printf '  node%-2s  %s\n' "$i" "$addr"
      fi
    fi
  done
else
  info "Install ethers.js to auto-derive addresses: npm install -g ethers"
  info "Private keys are in /opt/oarn/nodeN/config.toml"
fi

echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  All 10 nodes are running. Check status with:${NC}"
echo -e "${GREEN}    pm2 list${NC}"
echo -e "${GREEN}    pm2 logs oarn-node-4 --lines 20${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "Next: fund the node wallets above with Sepolia ETH, then run:"
echo "  node scripts/stress-test.mjs"
echo ""
