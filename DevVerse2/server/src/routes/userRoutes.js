// =============================================================================
// User Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');

// Authenticated user operations (me)
router.get('/me/following', protect, userController.getMyFollowing);
router.put('/profile', protect, csrfProtection, userController.updateProfile);
router.put('/username', protect, csrfProtection, userController.updateUsername);

// Public profile lookup & social follow
router.get('/:username', optionalAuth, userController.getProfile);
router.post('/:username/follow', protect, csrfProtection, userController.toggleFollow);

module.exports = router;
