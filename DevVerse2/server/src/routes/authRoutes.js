// =============================================================================
// Auth Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');

// Public routes
router.post('/register', csrfProtection, authController.register);
router.post('/signup', csrfProtection, authController.register); // Alias for signup
router.post('/login', csrfProtection, authController.login);
router.post('/oauth', csrfProtection, authController.oauthLogin);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/change-password', protect, csrfProtection, authController.changePassword);

module.exports = router;
