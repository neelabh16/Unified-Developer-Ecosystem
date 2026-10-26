// =============================================================================
// Portfolio Controller
// =============================================================================
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * Get portfolio by handle.
 * GET /api/v1/portfolios/:handle
 */
const getPortfolio = async (req, res, next) => {
  try {
    const { handle } = req.params;

    let portfolio = await Portfolio.findOne({ handle: handle.toLowerCase() });

    if (!portfolio) {
      // Check if user exists
      const user = await User.findOne({ username: handle.toLowerCase() });
      if (user) {
        portfolio = {
          handle: user.username,
          name: user.name,
          title: '',
          bio: user.bio,
          avatarSeed: user.avatarSeed,
          accent: '#7c6fff',
          skills: user.skills || [],
          links: [],
          projects: [],
        };
      }
    }

    if (!portfolio) {
      return next(new AppError(`Portfolio for @${handle} not found`, 404));
    }

    return sendSuccess(res, 200, 'Portfolio retrieved', { portfolio });
  } catch (error) {
    next(error);
  }
};

/**
 * Save or update authenticated user's portfolio.
 * PUT /api/v1/portfolios/me
 */
const updateMyPortfolio = async (req, res, next) => {
  try {
    const { name, title, bio, avatarSeed, accent, skills, links, projects } = req.body;

    const updates = {
      user: req.user._id,
      handle: req.user.username,
      name: name ? name.trim() : req.user.name,
      title: title ? title.trim() : '',
      bio: bio !== undefined ? bio.trim() : req.user.bio,
      avatarSeed: avatarSeed ? avatarSeed.trim() : req.user.avatarSeed,
      accent: accent || '#7c6fff',
      skills: Array.isArray(skills) ? skills : [],
      links: Array.isArray(links) ? links : [],
      projects: Array.isArray(projects) ? projects : [],
    };

    const portfolio = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    // Sync skills and bio to user model if provided
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        bio: portfolio.bio,
        skills: portfolio.skills,
        avatarSeed: portfolio.avatarSeed,
      },
    });

    // Award 30 milestone points for completing portfolio if skills & projects exist
    if (portfolio.skills.length >= 1 && portfolio.projects.length >= 1) {
      const existingAward = await Activity.findOne({
        user: req.user._id,
        bucket: 'milestone',
        reason: 'Completed your portfolio profile',
      });
      if (!existingAward) {
        await User.findByIdAndUpdate(req.user._id, { $inc: { points: 30 } });
        await Activity.create({
          user: req.user._id,
          amount: 30,
          reason: 'Completed your portfolio profile',
          bucket: 'milestone',
          entityId: portfolio._id.toString(),
        });
      }
    }

    return sendSuccess(res, 200, 'Portfolio saved successfully', { portfolio });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPortfolio,
  updateMyPortfolio,
};
