// =============================================================================
// Upload Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protected avatar upload route: POST /api/v1/uploads/avatar
router.post(
  '/avatar',
  protect,
  upload.single('avatar'),
  uploadController.uploadAvatar
);

module.exports = router;
