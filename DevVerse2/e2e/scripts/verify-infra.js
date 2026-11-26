const { spawn } = require('child_process');
const path = require('path');
const { chromium } = require('@playwright/test');
const {
  E2E_ROOT,
  E2E_MONGO_URI,
  E2E_API_PORT,
  resolveBrowserLaunchOptions,
} = require('../fixtures/env');
const { seedDatabase, disconnectSeedDb } = require('../fixtures/seed');

async function waitForHealth(url, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json?.database?.ready) return json;
      }
    } catch (_err) {
      // Server still starting
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const port = E2E_API_PORT;
  const healthUrl = `http://127.0.0.1:${port}/api/v1/health`;
  const serverProcess = spawn(
    process.execPath,
    [path.join(E2E_ROOT, 'scripts/start-e2e-server.js')],
    {
      cwd: E2E_ROOT,
      env: { ...process.env, PORT: port, CLIENT_ORIGIN: `http://127.0.0.1:${port}` },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let logs = '';
  serverProcess.stdout.on('data', (d) => {
    logs += d.toString();
  });
  serverProcess.stderr.on('data', (d) => {
    logs += d.toString();
  });

  try {
    const health = await waitForHealth(healthUrl);
    console.log('[verify:infra] Health 200:', JSON.stringify(health));

    const summary = await seedDatabase(E2E_MONGO_URI);
    await disconnectSeedDb();
    console.log('[verify:infra] Seeded DB:', JSON.stringify(summary));

    const browserOpts = resolveBrowserLaunchOptions();
    const browser = await chromium.launch({
      headless: true,
      ...(browserOpts.executablePath
        ? { executablePath: browserOpts.executablePath }
        : {}),
      ...(browserOpts.channel ? { channel: browserOpts.channel } : {}),
      args: ['--no-sandbox', '--disable-gpu'],
    });
    const page = await browser.newPage();
    const res = await page.goto(`http://127.0.0.1:${port}/api/v1/projects`, {
      waitUntil: 'domcontentloaded',
    });
    const bodyText = await page.locator('body').innerText();
    console.log(
      `[verify:infra] Headless ${browserOpts.browserName} loaded /api/v1/projects -> HTTP ${res.status()}, bytes=${bodyText.length}`
    );
    await browser.close();
    console.log('[verify:infra] SUCCESS');
  } catch (err) {
    console.error('[verify:infra] FAILED:', err.message);
    console.error('[verify:infra] Server logs:\n', logs);
    process.exitCode = 1;
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

main();
