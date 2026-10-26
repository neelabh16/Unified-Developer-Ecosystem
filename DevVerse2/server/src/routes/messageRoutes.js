// =============================================================================
// Message Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');

router.use(protect); // Messages require authentication

router.get('/:handle', messageController.getMessages);
router.post('/:handle', csrfProtection, messageController.sendMessage);
router.delete('/:handle/:messageId', csrfProtection, messageController.deleteMessage);

module.exports = router;
