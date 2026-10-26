// =============================================================================
// Portfolio Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { protect, optionalAuth } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');

router.get('/:handle', optionalAuth, portfolioController.getPortfolio);
router.put('/me', protect, csrfProtection, portfolioController.updateMyPortfolio);

module.exports = router;
