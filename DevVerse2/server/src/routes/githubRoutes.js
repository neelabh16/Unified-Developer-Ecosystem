// =============================================================================
// GitHub Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const { optionalAuth } = require('../middleware/auth');

router.get('/user/:username', optionalAuth, githubController.getUserGitHubData);
router.get('/user/:username/contributions', optionalAuth, githubController.getUserContributions);
router.get('/user/:username/events', optionalAuth, githubController.getUserEvents);
router.get('/user/:username/repos', optionalAuth, githubController.getUserRepos);
router.get('/repo/:owner/:repo', optionalAuth, githubController.getRepoDetails);

module.exports = router;
