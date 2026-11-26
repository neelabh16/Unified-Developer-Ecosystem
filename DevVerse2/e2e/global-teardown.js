const fs = require('fs');
const path = require('path');
const { disconnectSeedDb } = require('./fixtures/seed');
const { SERVER_UPLOADS_DIR } = require('./fixtures/env');

module.exports = async function globalTeardown() {
  await disconnectSeedDb();

  // Clean up test-uploaded files matching Multer's 32-hex filename pattern
  if (fs.existsSync(SERVER_UPLOADS_DIR)) {
    const entries = fs.readdirSync(SERVER_UPLOADS_DIR);
    for (const file of entries) {
      if (/^[0-9a-f]{32}\.(png|jpg|jpeg|webp|gif)$/i.test(file)) {
        try {
          fs.unlinkSync(path.join(SERVER_UPLOADS_DIR, file));
        } catch (_err) {
          // Ignore locked files on Windows
        }
      }
    }
  }
};
