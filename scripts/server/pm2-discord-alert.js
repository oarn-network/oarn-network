#!/usr/bin/env node
/**
 * pm2-discord-alert.js — PM2 crash alerter for OARN server.
 *
 * Runs as a PM2-managed process. Subscribes to PM2's internal event bus
 * and sends a Discord webhook message whenever a monitored process exits
 * unexpectedly or fails to restart.
 *
 * Monitored processes (WATCHED_APPS):
 *   oarn-api, oarn-node-1, oarn-node-2, oarn-node-3
 *
 * Required env vars (loaded from /etc/oarn/.env via ecosystem.config.js):
 *   DISCORD_ALERT_WEBHOOK  — Discord webhook URL for #alerts channel
 *
 * Optional env vars:
 *   WATCHED_APPS           — comma-separated PM2 app names (default: see below)
 *   ALERT_COOLDOWN_MS      — min ms between repeated alerts for same app (default: 60000)
 */

"use strict";

const pm2  = require("pm2");
const https = require("https");
const url  = require("url");

const WEBHOOK_URL   = process.env.DISCORD_ALERT_WEBHOOK;
const COOLDOWN_MS   = parseInt(process.env.ALERT_COOLDOWN_MS || "60000");
const WATCHED_APPS  = (process.env.WATCHED_APPS || "oarn-api,oarn-node-1,oarn-node-2,oarn-node-3")
  .split(",").map(s => s.trim());

if (!WEBHOOK_URL) {
  console.error("[alert] DISCORD_ALERT_WEBHOOK not set — alerter running in dry-run mode");
}

// Track last alert time per app to avoid spam
const lastAlerted = new Map();

// ─── Discord webhook ──────────────────────────────────────────────────────────

function sendDiscordAlert(appName, event, restarts) {
  const now = Date.now();
  const lastTime = lastAlerted.get(appName) || 0;
  if (now - lastTime < COOLDOWN_MS) {
    console.log(`[alert] Cooldown active for ${appName} — skipping duplicate alert`);
    return;
  }
  lastAlerted.set(appName, now);

  const emoji = "🔴";
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({
    username: "OARN Monitor",
    avatar_url: "https://raw.githubusercontent.com/oarn-network/oarn-network/main/oarn-website/img/oarn-logo.png",
    embeds: [{
      title: `${emoji} Process crashed: \`${appName}\``,
      color: 0xef4444,
      fields: [
        { name: "Event",    value: event,            inline: true },
        { name: "Restarts", value: String(restarts), inline: true },
        { name: "Server",   value: "Hetzner AX42-U (144.76.58.152)", inline: false },
      ],
      footer: { text: `OARN Alert • ${timestamp}` },
    }],
  });

  if (!WEBHOOK_URL) {
    console.log(`[alert][dry-run] Would send: ${payload}`);
    return;
  }

  const parsed = url.parse(WEBHOOK_URL);
  const options = {
    hostname: parsed.hostname,
    path: parsed.path,
    method: "POST",
    headers: {
      "Content-Type":   "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, res => {
    console.log(`[alert] Discord responded ${res.statusCode} for ${appName}`);
  });
  req.on("error", err => {
    console.error(`[alert] Webhook request failed: ${err.message}`);
  });
  req.write(payload);
  req.end();
}

// ─── PM2 bus subscription ─────────────────────────────────────────────────────

pm2.connect(err => {
  if (err) {
    console.error(`[alert] Failed to connect to PM2: ${err.message}`);
    process.exit(1);
  }
  console.log("[alert] Connected to PM2 daemon");

  pm2.launchBus((err, bus) => {
    if (err) {
      console.error(`[alert] Failed to launch PM2 bus: ${err.message}`);
      pm2.disconnect();
      process.exit(1);
    }
    console.log(`[alert] Watching: ${WATCHED_APPS.join(", ")}`);

    // PM2 emits 'process:event' for lifecycle transitions
    bus.on("process:event", packet => {
      const name  = packet.process && packet.process.name;
      const event = packet.event;

      if (!name || !WATCHED_APPS.includes(name)) return;

      // Alert on exit (unexpected crash) or when PM2 gives up restarting (stop)
      if (event === "exit" || event === "stop") {
        const restarts = (packet.process && packet.process.restart_time) || "?";
        console.log(`[alert] ${name} — event=${event} restarts=${restarts}`);
        sendDiscordAlert(name, event, restarts);
      }
    });

    // Also catch PM2 bus reconnection
    bus.on("reconnect attempt", () => {
      console.log("[alert] PM2 bus reconnecting...");
    });

    bus.on("close", () => {
      console.error("[alert] PM2 bus closed — exiting so PM2 will restart this process");
      process.exit(1);
    });
  });
});

// Graceful shutdown
process.on("SIGINT",  () => { pm2.disconnect(); process.exit(0); });
process.on("SIGTERM", () => { pm2.disconnect(); process.exit(0); });
