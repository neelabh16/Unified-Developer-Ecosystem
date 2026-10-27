// =============================================================================
// Activity & Points Controller
// =============================================================================
const Activity = require('../models/Activity');
const User = require('../models/User');
const githubService = require('../services/githubService');
const { sendSuccess } = require('../utils/response');

/**
 * Get user's points ledger and activity log.
 * GET /api/v1/activity/me
 */
const getMyActivity = async (req, res, next) => {
  try {
    let log = await Activity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const user = await User.findById(req.user._id);

    // If user's total points exceed recorded activities, backfill initial welcome bonus activity
    const activityTotal = log.reduce((sum, item) => sum + (item.amount || 0), 0);
    if (user && user.points > activityTotal) {
      const diff = user.points - activityTotal;
      const welcome = await Activity.create({
        user: user._id,
        amount: diff,
        reason: 'Welcome bonus — Account created',
        bucket: 'register',
        entityId: user._id.toString(),
        createdAt: user.createdAt || new Date(),
      });
      log.push(welcome);
      log.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return sendSuccess(res, 200, 'Activity retrieved', {
      totalPoints: user ? user.points : 0,
      log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get global activity feed for live feed display.
 * Blends real platform actions with live GitHub events.
 * GET /api/v1/activity/feed
 */
const getGlobalFeed = async (req, res, next) => {
  try {
    const platformFeed = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('user', 'name username avatarSeed points');

    // Convert platform activities to unified format
    const formattedPlatform = platformFeed.map((item) => ({
      id: item._id.toString(),
      type: 'platform',
      user: {
        name: (item.user && item.user.name) || 'Builder',
        username: (item.user && item.user.username) || 'builder',
        avatarSeed: (item.user && item.user.avatarSeed) || 'builder',
      },
      action: item.reason || item.action || 'earned points',
      description: item.reason || item.description || 'earned points',
      pointsEarned: item.amount || item.pointsEarned || 0,
      createdAt: item.createdAt,
    }));

    // Fetch real events from active GitHub user(s)
    let ghEvents = [];
    try {
      const activeGithubUsers = ['neelabh16'];
      // Also include any users found in database
      const dbUsers = await User.find({ username: { $ne: 'neelabh16' } }).limit(3).select('username name avatarSeed');
      dbUsers.forEach((u) => {
        if (u.username && !activeGithubUsers.includes(u.username)) {
          activeGithubUsers.push(u.username);
        }
      });

      const ghResults = await Promise.all(
        activeGithubUsers.map(async (u) => {
          const events = await githubService.fetchActivityFeed(u);
          return events.map((ev) => ({
            id: ev.id,
            type: 'github',
            user: {
              name: u === 'neelabh16' ? 'Neelabh' : u,
              username: u,
              avatarSeed: u,
              avatarUrl: ev.avatarUrl,
            },
            action: 'github_event',
            description: ev.description || ev.title,
            repo: ev.repo,
            url: ev.url,
            createdAt: new Date(ev.published),
          }));
        })
      );
      ghEvents = ghResults.flat();
    } catch (e) {
      console.warn('[ActivityController] Could not fetch GitHub live feed:', e.message);
    }

    // Combine and sort by createdAt descending
    const combined = [...formattedPlatform, ...ghEvents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sendSuccess(res, 200, 'Global feed retrieved', { feed: combined.slice(0, 20) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyActivity,
  getGlobalFeed,
};
