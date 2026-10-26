// =============================================================================
// Community Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { protect, optionalAuth } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');

router.get('/', optionalAuth, communityController.getCommunities);
router.get('/:id', optionalAuth, communityController.getCommunity);
router.post('/:id/join', protect, csrfProtection, communityController.toggleJoin);
router.get('/:id/discussions', optionalAuth, communityController.getCommunityDiscussions);
router.post('/:id/discussions', protect, csrfProtection, communityController.createCommunityDiscussion);

module.exports = router;
