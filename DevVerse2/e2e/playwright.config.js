const path = require('path');
const { defineConfig } = require('@playwright/test');
const {
  BASE_URL,
  E2E_MANAGE_SERVER,
  E2E_API_PORT,
  resolveBrowserLaunchOptions,
} = require('./fixtures/env');

const browserOptions = resolveBrowserLaunchOptions();
const isDevProxy = BASE_URL.includes(':5173');

let webServer;
if (E2E_MANAGE_SERVER) {
  const apiServer = {
    command: 'node scripts/start-e2e-server.js',
    url: `http://127.0.0.1:${E2E_API_PORT}/api/v1/health`,
    reuseExistingServer: false,
    timeout: 60_000,
  };

  if (isDevProxy) {
    webServer = [
      apiServer,
      {
        command: 'npm --prefix ../client run dev -- --port 5173 --strictPort',
        url: 'http://localhost:5173',
        reuseExistingServer: false,
        timeout: 60_000,
      },
    ];
  } else {
    webServer = apiServer;
  }
}

module.exports = defineConfig({
  testDir: path.join(__dirname, 'tests'),
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: require.resolve('./global-setup.js'),
  globalTeardown: require.resolve('./global-teardown.js'),
  use: {
    baseURL: BASE_URL,
    headless: process.env.E2E_HEADLESS !== 'false',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 12_000,
    navigationTimeout: 20_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      ...(browserOptions.executablePath
        ? { executablePath: browserOptions.executablePath }
        : {}),
      args: ['--no-sandbox', '--disable-gpu'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        ...(browserOptions.channel ? { channel: browserOptions.channel } : {}),
      },
    },
  ],
  ...(webServer ? { webServer } : {}),
});
