// =============================================================================
// User Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');

// Public profile lookup
router.get('/:username', userController.getProfile);

// Authenticated user operations
router.put('/profile', protect, csrfProtection, userController.updateProfile);
router.put('/username', protect, csrfProtection, userController.updateUsername);

module.exports = router;
