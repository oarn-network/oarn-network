#!/usr/bin/env bash
# =============================================================================
# OARN Network — Server Setup Script
# AX42-U, Ubuntu 22.04 LTS, Hetzner FSN1
#
# Run as root after OS installation via installimage.
# Usage: bash setup.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[OARN]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && fail "Run as root"

# ─── Variables ───────────────────────────────────────────────────────────────
OARN_USER="oarn"
OARN_HOME="/home/oarn"
DATA_DIR="/data"
OARN_CONFIG="/etc/oarn"
NODE_VERSION="20"
POSTGRES_VERSION="15"
REDIS_VERSION="7"

# ─── 0. System update ────────────────────────────────────────────────────────
log "0/10  System update..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip build-essential ufw fail2ban \
  htop iotop nethogs ncdu tree jq \
  ca-certificates gnupg lsb-release software-properties-common

# ─── 1. Mount /data (1 TB SATA SSD) ─────────────────────────────────────────
log "1/10  Setting up /data partition..."
SATA_DEV="/dev/sda"
if ! mountpoint -q "$DATA_DIR"; then
  if lsblk "$SATA_DEV" &>/dev/null; then
    if ! blkid "$SATA_DEV" | grep -q ext4; then
      log "  Formatting ${SATA_DEV} as ext4..."
      mkfs.ext4 -L oarn-data "$SATA_DEV"
    fi
    mkdir -p "$DATA_DIR"
    echo "LABEL=oarn-data  /data  ext4  defaults,noatime  0  2" >> /etc/fstab
    mount "$DATA_DIR"
    log "  /data mounted"
  else
    warn "  ${SATA_DEV} not found — skipping /data setup"
  fi
else
  log "  /data already mounted"
fi

# ─── 2. Firewall (ufw) ───────────────────────────────────────────────────────
log "2/10  Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
ufw allow 4001/tcp comment "IPFS swarm"
ufw allow 4001/udp comment "IPFS swarm UDP"
ufw --force enable
log "  ufw enabled"

# fail2ban — protect SSH
systemctl enable fail2ban --now

# Automatic security updates
cat > /etc/apt/apt.conf.d/50unattended-upgrades-oarn << 'EOF'
Unattended-Upgrade::Allowed-Origins {
  "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
systemctl enable unattended-upgrades --now

# ─── 3. Create oarn user ─────────────────────────────────────────────────────
log "3/10  Creating oarn system user..."
if ! id "$OARN_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$OARN_USER"
  usermod -aG sudo "$OARN_USER"
fi
mkdir -p "$OARN_CONFIG"
chown root:oarn "$OARN_CONFIG"
chmod 750 "$OARN_CONFIG"

# ─── 4. Node.js + pm2 ────────────────────────────────────────────────────────
log "4/10  Installing Node.js ${NODE_VERSION} + pm2..."
curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
apt-get install -y -qq nodejs
npm install -g pm2 --quiet
pm2 startup systemd -u "$OARN_USER" --hp "$OARN_HOME" | tail -1 | bash
log "  Node.js $(node -v), npm $(npm -v), pm2 $(pm2 -v)"

# ─── 5. PostgreSQL ───────────────────────────────────────────────────────────
log "5/10  Installing PostgreSQL ${POSTGRES_VERSION}..."
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] \
  https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list
apt-get update -qq
apt-get install -y -qq "postgresql-${POSTGRES_VERSION}"

# Generate a random DB password
DB_PASSWORD=$(openssl rand -base64 24)
sudo -u postgres psql -c "CREATE USER oarn_app WITH PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -c "CREATE DATABASE oarn_main OWNER oarn_app;"
sudo -u postgres psql -c "CREATE DATABASE oarn_analytics OWNER oarn_app;"

# Save credentials
cat > "${OARN_CONFIG}/db.env" << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USER=oarn_app
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=oarn_main
DB_ANALYTICS=oarn_analytics
EOF
chmod 640 "${OARN_CONFIG}/db.env"
log "  PostgreSQL running, databases created"

# ─── 6. Redis ────────────────────────────────────────────────────────────────
log "6/10  Installing Redis ${REDIS_VERSION}..."
curl -fsSL https://packages.redis.io/gpg \
  | gpg --dearmor -o /usr/share/keyrings/redis.gpg
echo "deb [signed-by=/usr/share/keyrings/redis.gpg] \
  https://packages.redis.io/deb $(lsb_release -cs) main" \
  > /etc/apt/sources.list.d/redis.list
apt-get update -qq
apt-get install -y -qq redis

REDIS_PASSWORD=$(openssl rand -base64 24)
sed -i "s/^# requirepass .*/requirepass ${REDIS_PASSWORD}/" /etc/redis/redis.conf
sed -i "s/^bind .*/bind 127.0.0.1/" /etc/redis/redis.conf
echo "maxmemory 2gb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
systemctl restart redis
systemctl enable redis

cat >> "${OARN_CONFIG}/db.env" << EOF
REDIS_URL=redis://:${REDIS_PASSWORD}@127.0.0.1:6379
EOF
log "  Redis running on localhost:6379"

# ─── 7. IPFS (Kubo) ──────────────────────────────────────────────────────────
log "7/10  Installing IPFS Kubo..."
IPFS_VERSION="0.27.0"
IPFS_ARCHIVE="kubo_v${IPFS_VERSION}_linux-amd64.tar.gz"
wget -q "https://dist.ipfs.tech/kubo/v${IPFS_VERSION}/${IPFS_ARCHIVE}" -O /tmp/kubo.tar.gz
tar -xzf /tmp/kubo.tar.gz -C /tmp
cp /tmp/kubo/ipfs /usr/local/bin/ipfs
rm -rf /tmp/kubo /tmp/kubo.tar.gz

# Init IPFS as oarn user, store data on /data
mkdir -p "${DATA_DIR}/ipfs"
chown oarn:oarn "${DATA_DIR}/ipfs"
sudo -u oarn IPFS_PATH="${DATA_DIR}/ipfs" ipfs init --profile server

# Configure IPFS
sudo -u oarn IPFS_PATH="${DATA_DIR}/ipfs" ipfs config \
  Datastore.StorageMax "800GB"
sudo -u oarn IPFS_PATH="${DATA_DIR}/ipfs" ipfs config \
  --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3001"]'
sudo -u oarn IPFS_PATH="${DATA_DIR}/ipfs" ipfs config \
  Addresses.API "/ip4/127.0.0.1/tcp/5001"
sudo -u oarn IPFS_PATH="${DATA_DIR}/ipfs" ipfs config \
  Addresses.Gateway "/ip4/127.0.0.1/tcp/8080"

# systemd service for IPFS
cat > /etc/systemd/system/ipfs.service << EOF
[Unit]
Description=IPFS Daemon
After=network.target

[Service]
User=oarn
Environment=IPFS_PATH=${DATA_DIR}/ipfs
ExecStart=/usr/local/bin/ipfs daemon --migrate=true
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable ipfs
systemctl start ipfs
log "  IPFS running, data at ${DATA_DIR}/ipfs"

# ─── 8. Nginx + Certbot ──────────────────────────────────────────────────────
log "8/10  Installing Nginx + Certbot..."
apt-get install -y -qq nginx certbot python3-certbot-nginx

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Install vhost configs (from this repo)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -d "${SCRIPT_DIR}/nginx" ]]; then
  cp "${SCRIPT_DIR}/nginx/"*.conf /etc/nginx/sites-available/
  for conf in /etc/nginx/sites-available/*.conf; do
    name=$(basename "$conf")
    ln -sf "/etc/nginx/sites-available/${name}" "/etc/nginx/sites-enabled/${name}"
  done
fi

# Security headers snippet
cat > /etc/nginx/snippets/security-headers.conf << 'EOF'
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
EOF

# Gzip config
cat > /etc/nginx/conf.d/gzip.conf << 'EOF'
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
EOF

nginx -t && systemctl restart nginx
systemctl enable nginx
log "  Nginx running"

# ─── 9. OARN API gateway ─────────────────────────────────────────────────────
log "9/10  Setting up OARN API gateway..."
API_DIR="${OARN_HOME}/api"
mkdir -p "$API_DIR"
chown -R oarn:oarn "$API_DIR"

if [[ -d "${SCRIPT_DIR}/api" ]]; then
  cp -r "${SCRIPT_DIR}/api/"* "$API_DIR/"
  chown -R oarn:oarn "$API_DIR"
  sudo -u oarn bash -c "cd $API_DIR && npm install --silent"
fi

# PM2 ecosystem config
cat > "${OARN_HOME}/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'oarn-api',
      cwd: '${API_DIR}',
      script: 'src/index.js',
      env_file: '${OARN_CONFIG}/.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      log_file: '/var/log/oarn/api.log',
      error_file: '/var/log/oarn/api.error.log',
    }
  ]
};
EOF
chown oarn:oarn "${OARN_HOME}/ecosystem.config.js"
mkdir -p /var/log/oarn
chown oarn:oarn /var/log/oarn

log "  API gateway configured"

# ─── 10. Create .env template ────────────────────────────────────────────────
log "10/10  Creating .env template..."
cat > "${OARN_CONFIG}/.env" << 'EOF'
# === OARN Server Configuration ===
# Fill in all values before starting services

# Blockchain
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NODE_PRIVATE_KEY=0x_YOUR_PRIVATE_KEY_HERE

# API
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://oarn-dashboard.vercel.app

# Contracts
TASK_REGISTRY=0xD15530ce13188EE88E43Ab07EDD9E8729fCc55D0
OARN_REGISTRY=0x8DD738DBBD4A8484872F84192D011De766Ba5458
WET_LAB_ORACLE=0xF8991A56cB5B9073a3eEC87E95Dfb055fdDF0094
GOVERNANCE=0x_GOVERNANCE_ADDRESS_HERE

# IPFS
IPFS_API=http://localhost:5001

# Loaded from db.env automatically — no need to copy here
EOF
chmod 640 "${OARN_CONFIG}/.env"
chown root:oarn "${OARN_CONFIG}/.env"

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  OARN Server Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Fill in secrets:    nano ${OARN_CONFIG}/.env"
echo "  2. Start API:          sudo -u oarn pm2 start ${OARN_HOME}/ecosystem.config.js"
echo "  3. Save pm2 state:     sudo -u oarn pm2 save"
echo "  4. SSL (after DNS):    certbot --nginx -d oarn.network -d api.oarn.network"
echo ""
echo "DB password saved in: ${OARN_CONFIG}/db.env"
echo "Redis password saved in: ${OARN_CONFIG}/db.env"
echo ""
