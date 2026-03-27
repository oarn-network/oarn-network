#!/usr/bin/env node
/**
 * setup.js — Upload benchmark ONNX models to IPFS and write model-registry.json.
 *
 * Prerequisites:
 *   1. Run create-models.py to generate ./models/*.onnx
 *   2. Have an IPFS daemon running locally (ipfs daemon) OR set IPFS_API_URL
 *      to a remote IPFS API endpoint (e.g. Infura, Web3.Storage pinning API)
 *
 * Usage:
 *   node scripts/benchmark/setup.js
 *   IPFS_API_URL=http://localhost:5001 node scripts/benchmark/setup.js
 */

const https = require("https");
const http  = require("http");
const fs    = require("fs");
const path  = require("path");
const { execSync } = require("child_process");

const MODELS_DIR   = path.join(__dirname, "models");
const REGISTRY     = path.join(__dirname, "model-registry.json");
const IPFS_API_URL = process.env.IPFS_API_URL || "http://localhost:5001";

// Models to upload: { filename, label, inputSize, outputSize, inputShape }
const MODEL_SPECS = [
  {
    filename:    "iris_classifier.onnx",
    label:       "iris_classifier",
    description: "Iris species classifier (4 float inputs → 3 class logits)",
    inputSize:   4,
    outputSize:  3,
    inputShape:  [1, 4],
    requirements: "onnx>=1.14",
  },
  {
    filename:    "linear_regression.onnx",
    label:       "linear_regression",
    description: "General linear regression (8 float inputs → 1 float output)",
    inputSize:   8,
    outputSize:  1,
    inputShape:  [1, 8],
    requirements: "onnx>=1.14",
  },
  {
    filename:    "mnist_mini.onnx",
    label:       "mnist_mini",
    description: "Mini MNIST MLP (784 float inputs → 10 class logits)",
    inputSize:   784,
    outputSize:  10,
    inputShape:  [1, 784],
    requirements: "onnx>=1.14",
  },
];

// ─── IPFS upload via local daemon API ───────────────────────────────────────

function ipfsAdd(filePath) {
  return new Promise((resolve, reject) => {
    const fileData   = fs.readFileSync(filePath);
    const boundary  = "----OARNBenchmarkBoundary";
    const filename   = path.basename(filePath);

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`),
      fileData,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const url    = new URL(`${IPFS_API_URL}/api/v0/add?pin=true`);
    const lib    = url.protocol === "https:" ? https : http;

    const req = lib.request({
      hostname: url.hostname,
      port:     url.port || (url.protocol === "https:" ? 443 : 80),
      path:     url.pathname + url.search,
      method:   "POST",
      headers: {
        "Content-Type":   `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.Hash) throw new Error(`No Hash in response: ${data}`);
          resolve(parsed.Hash);
        } catch (e) {
          reject(new Error(`IPFS add failed for ${filename}: ${e.message}\nResponse: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("OARN Benchmark — Model Setup");
  console.log("============================");
  console.log(`IPFS API: ${IPFS_API_URL}`);
  console.log(`Models dir: ${MODELS_DIR}\n`);

  if (!fs.existsSync(MODELS_DIR)) {
    console.error(`Error: models/ directory not found at ${MODELS_DIR}`);
    console.error("Run: python3 scripts/benchmark/create-models.py");
    process.exit(1);
  }

  const registry = { models: [] };

  for (const spec of MODEL_SPECS) {
    const filePath = path.join(MODELS_DIR, spec.filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ Skipping ${spec.filename} — file not found`);
      continue;
    }

    process.stdout.write(`  Uploading ${spec.filename}... `);
    const cid = await ipfsAdd(filePath);
    console.log(`✓  CID: ${cid}`);

    registry.models.push({
      label:        spec.label,
      description:  spec.description,
      cid,
      filename:     spec.filename,
      inputSize:    spec.inputSize,
      outputSize:   spec.outputSize,
      inputShape:   spec.inputShape,
      requirements: spec.requirements,
      uploadedAt:   new Date().toISOString(),
    });
  }

  if (registry.models.length === 0) {
    console.error("\nNo models uploaded. Exiting.");
    process.exit(1);
  }

  fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n");
  console.log(`\n✓ model-registry.json written (${registry.models.length} models)`);
  console.log("Next: run benchmark-loop.js to start submitting tasks.");
}

main().catch(err => {
  console.error("\nSetup failed:", err.message);
  process.exit(1);
});
