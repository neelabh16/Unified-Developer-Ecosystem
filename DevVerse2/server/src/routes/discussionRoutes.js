// =============================================================================
// Discussion Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const { protect, optionalAuth } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');

router.get('/', optionalAuth, discussionController.getAllDiscussions);
router.get('/:id', optionalAuth, discussionController.getDiscussion);
router.put('/:id', protect, csrfProtection, discussionController.updateDiscussion);
router.delete('/:id', protect, csrfProtection, discussionController.deleteDiscussion);

// Replies
router.post('/:id/replies', protect, csrfProtection, discussionController.addReply);
router.delete('/:id/replies/:replyId', protect, csrfProtection, discussionController.deleteReply);

module.exports = router;
