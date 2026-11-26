const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_URL = (process.env.API_URL || `${BASE_URL}/api/v1`).replace(/\/+$/, '');
const E2E_MONGO_URI = process.env.E2E_MONGO_URI || 'mongodb://127.0.0.1:27017/devverse_e2e_test';
const E2E_API_PORT = process.env.E2E_API_PORT || '5000';
const E2E_JWT_SECRET =
  process.env.E2E_JWT_SECRET || 'devverse_e2e_test_jwt_secret_key_32chars';
const E2E_MANAGE_SERVER = process.env.E2E_MANAGE_SERVER === 'true';

const E2E_ROOT = path.resolve(__dirname, '..');
const SERVER_UPLOADS_DIR = path.resolve(__dirname, '../../server/uploads');

function resolveBrowserLaunchOptions() {
  const override = process.env.E2E_BROWSER_EXECUTABLE;
  if (override) {
    if (!fs.existsSync(override)) {
      throw new Error(`E2E_BROWSER_EXECUTABLE does not exist: ${override}`);
    }
    return {
      executablePath: override,
      browserName: path.basename(override),
    };
  }

  if (fs.existsSync(CHROME_PATH)) {
    return {
      channel: 'chrome',
      executablePath: CHROME_PATH,
      browserName: 'chrome',
    };
  }

  if (fs.existsSync(EDGE_PATH)) {
    return {
      channel: 'msedge',
      executablePath: EDGE_PATH,
      browserName: 'msedge',
    };
  }

  throw new Error(
    `No compatible browser executable found. Checked:\n- ${CHROME_PATH}\n- ${EDGE_PATH}\nSet E2E_BROWSER_EXECUTABLE to override.`
  );
}

module.exports = {
  CHROME_PATH,
  EDGE_PATH,
  BASE_URL,
  API_URL,
  E2E_MONGO_URI,
  E2E_API_PORT,
  E2E_JWT_SECRET,
  E2E_MANAGE_SERVER,
  E2E_ROOT,
  SERVER_UPLOADS_DIR,
  resolveBrowserLaunchOptions,
};
