// =============================================================================
// Bookmark Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', bookmarkController.getMyBookmarks);

module.exports = router;
