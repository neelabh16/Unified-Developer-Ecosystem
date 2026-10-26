// =============================================================================
// Activity & Points Controller
// =============================================================================
const Activity = require('../models/Activity');
const User = require('../models/User');
const { sendSuccess } = require('../utils/response');

/**
 * Get user's points ledger and activity log.
 * GET /api/v1/activity/me
 */
const getMyActivity = async (req, res, next) => {
  try {
    const log = await Activity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const user = await User.findById(req.user._id);

    return sendSuccess(res, 200, 'Activity retrieved', {
      totalPoints: user.points,
      log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get global activity feed for live feed display.
 * GET /api/v1/activity/feed
 */
const getGlobalFeed = async (req, res, next) => {
  try {
    const feed = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('user', 'name username avatarSeed points');

    return sendSuccess(res, 200, 'Global feed retrieved', { feed });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyActivity,
  getGlobalFeed,
};
