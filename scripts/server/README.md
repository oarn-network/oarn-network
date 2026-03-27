# OARN Server Setup — AX42-U (Hetzner FSN1)

## Quick Start

After receiving SSH access from Hetzner Robot:

### Step 1 — Install OS (from rescue system)
```bash
ssh root@<YOUR_SERVER_IP>
# You land in the rescue shell
installimage
```
In the installimage UI:
- Select **Ubuntu** → **Ubuntu 22.04 LTS (Jammy)**
- Set `HOSTNAME oarn-node1`
- Drive layout:
  - `/dev/nvme0n1` (512 GB NVMe) → `/`  — OS, databases, node software
  - `/dev/sda` (1 TB SATA SSD) → `/data` — IPFS storage
- Save & exit → server reboots (~3 min)

### Step 2 — SSH back in after reboot
```bash
ssh root@<YOUR_SERVER_IP>
```

### Step 3 — Run setup script
```bash
curl -fsSL https://raw.githubusercontent.com/oarn-network/oarn-network/main/scripts/server/setup.sh | bash
```
Or copy-paste from this repo:
```bash
bash scripts/server/setup.sh
```

### Step 4 — Configure secrets
```bash
nano /etc/oarn/.env
# Fill in: RPC_URL, PRIVATE_KEY, DISCORD_BOT_TOKEN, DB_PASSWORD, etc.
pm2 restart all
```

---

## What gets installed
- **Base:** ufw firewall, fail2ban, unattended-upgrades, htop, git, curl
- **Node.js 20 LTS** + pm2
- **Nginx** + Certbot (Let's Encrypt)
- **PostgreSQL 15** + pgBouncer
- **Redis 7**
- **IPFS Kubo** (full node, data on /data)
- **oarn-node** binary (latest release)
- **OARN API gateway** (Express, port 3001)

## Ports
| Port | Service | Public? |
|------|---------|---------|
| 22 | SSH | Yes (restrict to your IP) |
| 80 | Nginx HTTP | Yes |
| 443 | Nginx HTTPS | Yes |
| 3001 | API gateway | No (behind Nginx) |
| 5432 | PostgreSQL | No |
| 6379 | Redis | No |
| 4001 | IPFS swarm | Yes |
| 5001 | IPFS API | No (localhost only) |
| 8080 | IPFS gateway | No (behind Nginx) |
