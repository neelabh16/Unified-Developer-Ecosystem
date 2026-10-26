// =============================================================================
// Activity Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/me', protect, activityController.getMyActivity);
router.get('/feed', optionalAuth, activityController.getGlobalFeed);

module.exports = router;
