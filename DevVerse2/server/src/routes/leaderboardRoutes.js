// =============================================================================
// Leaderboard Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, leaderboardController.getLeaderboard);

module.exports = router;
