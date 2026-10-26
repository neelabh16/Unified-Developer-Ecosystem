// =============================================================================
// Hackathon Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const hackathonController = require('../controllers/hackathonController');
const { protect, optionalAuth } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');

router.get('/', optionalAuth, hackathonController.getHackathons);
router.get('/:id', optionalAuth, hackathonController.getHackathon);
router.post('/:id/register', protect, csrfProtection, hackathonController.toggleRegister);
router.post('/:id/bookmark', protect, csrfProtection, hackathonController.toggleBookmark);

module.exports = router;
