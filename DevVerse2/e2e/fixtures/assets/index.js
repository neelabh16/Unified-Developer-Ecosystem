const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 transparent PNG (68 bytes)
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const ASSETS_DIR = __dirname;
const VALID_PNG_PATH = path.join(ASSETS_DIR, 'valid-tiny.png');
const INVALID_TXT_PATH = path.join(ASSETS_DIR, 'invalid.txt');
const INVALID_PDF_PATH = path.join(ASSETS_DIR, 'invalid.pdf');

function ensureTinyPng() {
  if (!fs.existsSync(VALID_PNG_PATH)) {
    fs.writeFileSync(VALID_PNG_PATH, Buffer.from(TINY_PNG_BASE64, 'base64'));
  }
  return VALID_PNG_PATH;
}

ensureTinyPng();

function createOversizedPngPayload(sizeBytes = 10 * 1024 * 1024 + 4096) {
  const header = Buffer.from(TINY_PNG_BASE64, 'base64');
  const buf = Buffer.alloc(sizeBytes, 0x41);
  header.copy(buf, 0);
  return {
    name: 'oversized-test.png',
    mimeType: 'image/png',
    buffer: buf,
  };
}

function createMediumPngPayload(sizeBytes = 2.5 * 1024 * 1024) {
  const header = Buffer.from(TINY_PNG_BASE64, 'base64');
  const buf = Buffer.alloc(Math.floor(sizeBytes), 0x42);
  header.copy(buf, 0);
  return {
    name: 'over-2mb-test.png',
    mimeType: 'image/png',
    buffer: buf,
  };
}

module.exports = {
  ASSETS_DIR,
  VALID_PNG_PATH,
  INVALID_TXT_PATH,
  INVALID_PDF_PATH,
  ensureTinyPng,
  createOversizedPngPayload,
  createMediumPngPayload,
};
