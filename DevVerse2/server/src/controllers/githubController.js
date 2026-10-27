// =============================================================================
// GitHub Controller
// =============================================================================
const githubService = require('../services/githubService');
const User = require('../models/User');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/AppError');

/**
 * Get comprehensive GitHub data for a user handle.
 * GET /api/v1/github/user/:username
 */
const getUserGitHubData = async (req, res, next) => {
  try {
    let { username } = req.params;
    if (!username || username === 'you') {
      if (req.user && req.user.username) {
        username = req.user.username;
      } else {
        username = 'neelabh16';
      }
    }

    // Try finding the user in DevVerse to see if they have custom settings or linked handle
    const devUser = await User.findOne({ username: username.toLowerCase() });
    const targetGithub = (devUser && devUser.username) || username;

    const data = await githubService.getGitHubUserData(targetGithub);

    if (!data) {
      return next(new AppError('Failed to fetch GitHub data for user', 404));
    }

    return sendSuccess(res, 200, 'GitHub user data retrieved', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get GitHub contributions calendar.
 * GET /api/v1/github/user/:username/contributions
 */
const getUserContributions = async (req, res, next) => {
  try {
    let { username } = req.params;
    if (!username || username === 'you') {
      username = req.user ? req.user.username : 'neelabh16';
    }

    const data = await githubService.fetchContributions(username);
    return sendSuccess(res, 200, 'GitHub contributions retrieved', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get GitHub activity events.
 * GET /api/v1/github/user/:username/events
 */
const getUserEvents = async (req, res, next) => {
  try {
    let { username } = req.params;
    if (!username || username === 'you') {
      username = req.user ? req.user.username : 'neelabh16';
    }

    const events = await githubService.fetchActivityFeed(username);
    return sendSuccess(res, 200, 'GitHub events retrieved', { events });
  } catch (error) {
    next(error);
  }
};

/**
 * Get GitHub public repositories.
 * GET /api/v1/github/user/:username/repos
 */
const getUserRepos = async (req, res, next) => {
  try {
    let { username } = req.params;
    if (!username || username === 'you') {
      username = req.user ? req.user.username : 'neelabh16';
    }

    const repos = await githubService.fetchRepositories(username);
    return sendSuccess(res, 200, 'GitHub repositories retrieved', { repos });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserGitHubData,
  getUserContributions,
  getUserEvents,
  getUserRepos,
};
