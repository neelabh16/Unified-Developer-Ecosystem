// =============================================================================
// File Upload Middleware (Multer with Security Checks)
// =============================================================================
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types and corresponding extensions
const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate an unguessable 32-character random hex filename
    const randomHex = crypto.randomBytes(16).toString('hex');
    const ext = MIME_EXTENSION_MAP[file.mimetype.toLowerCase()] || path.extname(file.originalname).toLowerCase();
    // Sanitize extension to ensure it contains only alphanumeric chars
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
    cb(null, `${randomHex}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  if (MIME_EXTENSION_MAP[mime]) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF images are permitted.',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit per file
  },
  fileFilter,
});

module.exports = upload;
