const net = require('net');
const mongoose = require('mongoose');
const {
  BASE_URL,
  API_URL,
  E2E_MONGO_URI,
  resolveBrowserLaunchOptions,
} = require('../fixtures/env');

function checkTcpPort(host, port, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      settled = true;
      socket.destroy();
      resolve();
    });
    socket.on('timeout', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(new Error(`TCP timeout connecting to ${host}:${port}`));
      }
    });
    socket.on('error', (err) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(err);
      }
    });
    socket.connect(port, host);
  });
}

async function main() {
  const requireServer =
    process.argv.includes('--require-server') ||
    process.env.E2E_REQUIRE_SERVER === 'true';

  const errors = [];

  // 1. Node version check
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 20) {
    errors.push(`Node.js >= 20 required; found ${process.version}`);
  } else {
    console.log(`[check-env] Node: ${process.version} (${process.arch})`);
  }

  // 2. Chrome/Edge binary check
  try {
    const browser = resolveBrowserLaunchOptions();
    console.log(
      `[check-env] Browser: ${browser.browserName} (${browser.executablePath})`
    );
  } catch (err) {
    errors.push(err.message);
  }

  // 3. MongoDB check
  try {
    const parsed = new URL(E2E_MONGO_URI);
    const host = parsed.hostname || '127.0.0.1';
    const port = Number(parsed.port || 27017);
    await checkTcpPort(host, port);
    await mongoose.connect(E2E_MONGO_URI, { serverSelectionTimeoutMS: 4000 });
    const adminRes = await mongoose.connection.db.admin().ping();
    console.log(
      `[check-env] MongoDB: ${E2E_MONGO_URI} reachable (ok=${adminRes.ok})`
    );
    await mongoose.disconnect();
  } catch (err) {
    errors.push(`MongoDB check failed for ${E2E_MONGO_URI}: ${err.message}`);
  }

  // 4. Optional live server /health check
  if (requireServer) {
    try {
      const healthRes = await fetch(`${API_URL}/health`);
      if (!healthRes.ok) {
        throw new Error(`HTTP ${healthRes.status} from ${API_URL}/health`);
      }
      const payload = await healthRes.json();
      if (!payload?.database?.ready) {
        throw new Error(`Server database not ready: ${JSON.stringify(payload)}`);
      }
      console.log(
        `[check-env] Server Health: ${API_URL}/health -> 200 (${payload.environment})`
      );

      const pageRes = await fetch(BASE_URL);
      console.log(`[check-env] Base URL: ${BASE_URL} -> HTTP ${pageRes.status}`);
    } catch (err) {
      errors.push(`Live server check failed: ${err.message}`);
    }
  } else {
    console.log(
      `[check-env] Server check skipped (pass --require-server to verify ${API_URL}/health)`
    );
  }

  if (errors.length > 0) {
    console.error('[check-env] FAILED:');
    for (const msg of errors) {
      console.error(`  - ${msg}`);
    }
    process.exit(1);
  }

  console.log('[check-env] ALL PREFLIGHT CHECKS PASSED');
}

main().catch((err) => {
  console.error('[check-env] Unexpected error:', err);
  process.exit(1);
});
