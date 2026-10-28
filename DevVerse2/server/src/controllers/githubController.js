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
      const clientUser = req.headers['x-devverse-username'] || (req.user && (req.user.github || req.user.username));
      if (clientUser) {
        username = clientUser;
      } else {
        username = 'neelabh16';
      }
    }

    // Try finding the user in DevVerse by username, github handle, or email
    const cleanParam = (username || '').toLowerCase().trim();
    const devUser = await User.findOne({
      $or: [
        { username: cleanParam },
        { github: username.trim() },
        { github: cleanParam },
        { email: cleanParam },
      ],
    });
    const targetGithub = (devUser && (devUser.github || devUser.username)) || username;

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

/**
 * Get detailed repository data for project submission or exploration.
 * GET /api/v1/github/repo/:owner/:repo
 */
const getRepoDetails = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    if (!owner || !repo) {
      return next(new AppError('Please provide repository owner and name.', 400));
    }

    const data = await githubService.getRepoDetails(owner, repo);
    if (!data) {
      return next(new AppError('Repository not found or private.', 404));
    }

    return sendSuccess(res, 200, 'Repository details retrieved', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserGitHubData,
  getUserContributions,
  getUserEvents,
  getUserRepos,
  getRepoDetails,
};
