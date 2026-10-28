// =============================================================================
// Leaderboard Controller
// =============================================================================
const User = require('../models/User');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Engagement = require('../models/Engagement');
const { sendSuccess } = require('../utils/response');

/**
 * Get leaderboard rankings for developers or projects.
 * GET /api/v1/leaderboard?mode=devs|projects&range=weekly|monthly|all
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { mode = 'devs', range = 'weekly' } = req.query;

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

    // Determine timeframe for developer activity
    const since = range === 'weekly'
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : range === 'monthly'
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : null;

    let userRangeMap = {};
    if (since) {
      try {
        if (typeof Activity.aggregate === 'function') {
          const activitySums = await Activity.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: { _id: '$user', total: { $sum: '$amount' } } },
          ]);
          if (Array.isArray(activitySums)) {
            activitySums.forEach((item) => {
              if (item && item._id) {
                userRangeMap[item._id.toString()] = item.total;
              }
            });
          }
        }
      } catch (aggErr) {}
    }

    const devs = await User.find()
      .sort({ points: -1 })
      .limit(50)
      .select('name username avatarSeed bio skills points createdAt');

    const userIds = devs.map((u) => u._id);
    const [projectCounts, followCounts] = await Promise.all([
      Project.aggregate([
        { $match: { author: { $in: userIds } } },
        { $group: { _id: '$author', count: { $sum: 1 } } },
      ]).catch(() => []),
      Engagement.aggregate([
        { $match: { type: 'follow', targetType: 'user', targetId: { $in: userIds.map((id) => id.toString()) } } },
        { $group: { _id: '$targetId', count: { $sum: 1 } } },
      ]).catch(() => []),
    ]);

    const projMap = {};
    if (Array.isArray(projectCounts)) {
      projectCounts.forEach((p) => { if (p && p._id) projMap[p._id.toString()] = p.count; });
    }
    const followMap = {};
    if (Array.isArray(followCounts)) {
      followCounts.forEach((f) => { if (f && f._id) followMap[f._id.toString()] = f.count; });
    }

    const mapped = devs.map((u) => {
      let rangePoints = u.points || 0;
      if (since) {
        if (u._id && typeof userRangeMap[u._id.toString()] === 'number') {
          rangePoints = userRangeMap[u._id.toString()];
        } else if (u.createdAt && u.createdAt >= since) {
          rangePoints = u.points || 0;
        } else {
          rangePoints = 0;
        }
      }
      return {
        _id: u._id,
        name: u.name,
        username: u.username || u.handle,
        avatarSeed: u.avatarSeed,
        bio: u.bio,
        skills: u.skills,
        allTimePoints: u.points || 0,
        points: rangePoints,
        projectsCount: projMap[u._id.toString()] || 0,
        followersCount: followMap[u._id.toString()] || 0,
      };
    });

    mapped.sort((a, b) => b.points - a.points);

    return sendSuccess(res, 200, 'Developer leaderboard retrieved', {
      mode: 'devs',
      range,
      rankings: mapped.slice(0, 20),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
};
