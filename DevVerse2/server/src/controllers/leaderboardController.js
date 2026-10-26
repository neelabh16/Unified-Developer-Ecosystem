// =============================================================================
// Leaderboard Controller
// =============================================================================
const User = require('../models/User');
const Project = require('../models/Project');
const { sendSuccess } = require('../utils/response');

/**
 * Get leaderboard rankings for developers or projects.
 * GET /api/v1/leaderboard?mode=devs|projects&range=weekly|monthly|all
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { mode = 'devs', range = 'all' } = req.query;

    if (mode === 'projects') {
      const projects = await Project.find()
        .sort({ likesCount: -1, viewsCount: -1 })
        .limit(20)
        .populate('author', 'name username avatarSeed');

      return sendSuccess(res, 200, 'Project leaderboard retrieved', {
        mode: 'projects',
        range,
        rankings: projects,
      });
    }

    // Default: Developer rankings by points
    const devs = await User.find()
      .sort({ points: -1 })
      .limit(20)
      .select('name username avatarSeed bio skills points');

    return sendSuccess(res, 200, 'Developer leaderboard retrieved', {
      mode: 'devs',
      range,
      rankings: devs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
};
