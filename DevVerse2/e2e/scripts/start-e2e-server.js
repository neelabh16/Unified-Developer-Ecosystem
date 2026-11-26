const {
  E2E_MONGO_URI,
  E2E_API_PORT,
  E2E_JWT_SECRET,
  BASE_URL,
} = require('../fixtures/env');

// Populate isolated E2E env BEFORE requiring DevVerse2/server/src/server.js
// so dotenv.config() inside server.js never loads Atlas MONGODB_URI or OAuth keys,
// and caller shell env vars (e.g. MONGODB_URI / PORT) cannot hijack E2E isolation.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = E2E_MONGO_URI;
process.env.JWT_SECRET = E2E_JWT_SECRET;
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.PORT = E2E_API_PORT;
process.env.CLIENT_ORIGIN = BASE_URL;
process.env.COOKIE_SECURE = 'false';
process.env.GITHUB_CLIENT_ID = '';
process.env.GITHUB_CLIENT_SECRET = '';
process.env.GOOGLE_CLIENT_ID = '';
process.env.GOOGLE_CLIENT_SECRET = '';

const { startServer } = require('../../server/src/server');

async function boot() {
  try {
    await startServer();
  } catch (err) {
    console.error('[E2E Server] Failed to start:', err);
    process.exit(1);
  }
}

boot();
