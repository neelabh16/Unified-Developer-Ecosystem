const fs = require('fs');
const { seedDatabase, disconnectSeedDb } = require('./fixtures/seed');
const { E2E_MONGO_URI, SERVER_UPLOADS_DIR } = require('./fixtures/env');
const { ensureTinyPng } = require('./fixtures/assets');

module.exports = async function globalSetup() {
  ensureTinyPng();
  if (!fs.existsSync(SERVER_UPLOADS_DIR)) {
    fs.mkdirSync(SERVER_UPLOADS_DIR, { recursive: true });
  }
  await seedDatabase(E2E_MONGO_URI);
  await disconnectSeedDb();
};
