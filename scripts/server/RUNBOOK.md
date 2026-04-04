# Server Setup Runbook — Hetzner AX42-U

## When the Hetzner email arrives → do these steps in order

---

## Step 1 — SSH into rescue system

```bash
ssh root@<SERVER_IP>
```
Password is in the Hetzner email. You land in the rescue shell.

---

## Step 2 — Add your SSH key BEFORE installimage

This ensures the key is copied to the installed OS automatically:

```bash
echo "your-ssh-public-key" >> /root/.ssh/authorized_keys
```

---

## Step 3 — Run installimage

```bash
installimage
```

Navigate with arrow keys:
- Select **Ubuntu** → **Ubuntu 24.04 LTS**
- An editor opens with a config file. Make these changes:

```
DRIVE1 /dev/nvme0n1
DRIVE2 /dev/nvme1n1

SWRAID 1
SWRAIDLEVEL 1

HOSTNAME oarn-node1

PART /boot ext4 1G
PART lvm vg0 all

LV vg0 root /     ext4  100G
LV vg0 data /data ext4  all
```

> If you have additional drives (e.g. 1TB SATA), leave them — setup.sh handles mounting.

- Press **F2** to save, **F10** to install
- Confirm when asked → installation takes ~3 min → server reboots

---

## Step 4 — SSH back in after reboot

```bash
ssh-keygen -R <SERVER_IP>
ssh root@<SERVER_IP>
```

No password needed if you added your key in Step 2.

---

## Step 5 — Run OARN setup script

```bash
git clone https://github.com/oarn-network/oarn-network /tmp/oarn-setup
bash /tmp/oarn-setup/scripts/server/setup.sh
```

This takes ~5–10 minutes. Installs: ufw, Node.js, pm2, PostgreSQL, Redis, IPFS, Nginx, API gateway.

---

## Step 6 — Fill in secrets

```bash
nano /etc/oarn/.env
```

Set:
- `NODE_PRIVATE_KEY=0x...`  ← your node wallet private key
- `DISCORD_ALERT_WEBHOOK=https://discord.com/api/webhooks/...` ← Discord #alerts webhook URL
  (Discord → Server Settings → Integrations → Webhooks → New Webhook → #alerts → Copy URL)
- Everything else is pre-filled with correct contract addresses

---

## Step 7 — Start services

```bash
pm2 start /home/oarn/ecosystem.config.js
pm2 save
```

---

## Step 8 — Verify everything works

```bash
# Check API health
curl http://localhost:3001/health

# Check IPFS
ipfs --api /ip4/127.0.0.1/tcp/5001 id

# Check PostgreSQL
sudo -u postgres psql -c "\l"

# Check Redis
redis-cli -u $(grep REDIS_URL /etc/oarn/db.env | cut -d= -f2-) ping

# Check Nginx
nginx -t && systemctl status nginx
```

---

## Adding Discord crash alerting to an existing server

Run this on the Hetzner server (as root or oarn user):

```bash
# 1. Pull latest code
cd /opt/oarn/oarn-network && git pull

# 2. Set the webhook in .env
nano /etc/oarn/.env
# Add: DISCORD_ALERT_WEBHOOK=https://discord.com/api/webhooks/...

# 3. Install the pm2 npm package (needed by the alerter script)
sudo -u oarn npm install --prefix /home/oarn pm2 --save

# 4. Add oarn-alert to the ecosystem and (re)start
sudo -u oarn pm2 start /home/oarn/ecosystem.config.js
sudo -u oarn pm2 save

# 5. Verify it connected
sudo -u oarn pm2 logs oarn-alert --lines 10
```

Expected log output:
```
[alert] Connected to PM2 daemon
[alert] Watching: oarn-api, oarn-node-1, oarn-node-2, oarn-node-3
```

To test manually (kills oarn-api for 1 restart, PM2 auto-recovers):
```bash
sudo -u oarn pm2 stop oarn-api
# → Discord #alerts should receive an embed within ~2 seconds
sudo -u oarn pm2 start oarn-api
```

---

## Checklist

- [ ] Server provisioned (Hetzner email received)
- [ ] SSH key added to rescue system before installimage
- [ ] installimage complete (Ubuntu 24.04, RAID 1)
- [ ] SSH key login works (no password)
- [ ] setup.sh ran successfully
- [ ] /etc/oarn/.env filled in (NODE_PRIVATE_KEY + DISCORD_ALERT_WEBHOOK)
- [ ] Services started (pm2, ipfs, nginx)
- [ ] `curl http://<SERVER_IP>/health` returns `{"status":"ok"}`
- [ ] `pm2 logs oarn-alert` shows "Connected to PM2 daemon"
