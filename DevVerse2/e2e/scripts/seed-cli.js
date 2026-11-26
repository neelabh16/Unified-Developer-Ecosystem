const { seedDatabase, disconnectSeedDb } = require('../fixtures/seed');
const { E2E_MONGO_URI } = require('../fixtures/env');

async function main() {
  try {
    const summary = await seedDatabase(E2E_MONGO_URI);
    console.log('[seed-cli] Seeded isolated E2E database:', E2E_MONGO_URI);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await disconnectSeedDb();
  }
}

main().catch((err) => {
  console.error('[seed-cli] Failed:', err);
  process.exit(1);
});
