// =============================================================================
// Portfolio Controller
// =============================================================================
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * Get portfolio by handle.
 * GET /api/v1/portfolios/:handle
 */
const getPortfolio = async (req, res, next) => {
  try {
    let { handle } = req.params;

    if ((handle === 'me' || handle === 'you') && req.user) {
      handle = req.user.username;
    }

    let portfolio = await Portfolio.findOne({ handle: handle.toLowerCase() });
    let user = await User.findOne({ username: handle.toLowerCase() });

    if (!portfolio && user) {
      portfolio = await Portfolio.create({
        user: user._id,
        handle: user.username,
        name: user.name,
        title: '',
        bio: user.bio || '',
        avatarSeed: user.avatarUrl || user.avatarSeed || user.username || 'you-builder',
        accent: '#7c6fff',
        skills: user.skills || [],
        links: [],
        projects: [],
      });
    }

    if (!portfolio) {
      // Dynamic fallback for demo devs or users without a database record yet
      const fallbackPortfolio = {
        handle: handle.toLowerCase(),
        name: handle,
        title: 'Developer',
        bio: '',
        avatarSeed: handle,
        accent: '#7c6fff',
        skills: [],
        links: [],
        projects: [],
      };
      return sendSuccess(res, 200, 'Portfolio retrieved', { portfolio: fallbackPortfolio });
    }

    const portObj = portfolio.toObject ? portfolio.toObject() : { ...portfolio };

    if (user) {
      if (user.avatarUrl) {
        portObj.avatarUrl = user.avatarUrl;
        portObj.avatarSeed = user.avatarUrl;
      }
      if (!portObj.bio && user.bio) {
        portObj.bio = user.bio;
      }
      if ((!portObj.skills || !portObj.skills.length) && user.skills && user.skills.length) {
        portObj.skills = user.skills;
      }
    }

    // Auto-populate / merge projects created by this user in Explore
    const targetUserId = user ? user._id : portObj.user;
    if (targetUserId) {
      const uploadedProjects = await Project.find({
        $or: [{ author: targetUserId }, { authorHandle: handle.toLowerCase() }],
      }).select('title desc githubUrl category tags createdAt');

      let currentProjects = Array.isArray(portObj.projects) ? [...portObj.projects] : [];
      let changed = false;

      uploadedProjects.forEach((up) => {
        const existingIdx = currentProjects.findIndex(
          (p) => p.title && p.title.toLowerCase() === up.title.toLowerCase()
        );
        if (existingIdx === -1) {
          currentProjects.push({
            title: up.title,
            desc: up.desc || '',
            githubUrl: up.githubUrl || '',
          });
          changed = true;
        } else {
          // If project exists in portfolio but missing githubUrl, merge it from Explore project
          if (!currentProjects[existingIdx].githubUrl && up.githubUrl) {
            currentProjects[existingIdx].githubUrl = up.githubUrl;
            changed = true;
          }
        }
      });

      if (changed) {
        portObj.projects = currentProjects;
        await Portfolio.findByIdAndUpdate(portfolio._id, { $set: { projects: currentProjects } }).catch(() => {});
      }
    }

    return sendSuccess(res, 200, 'Portfolio retrieved', { portfolio: portObj });
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

    const sanitizedProjects = (Array.isArray(projects) ? projects : []).map((p) => ({
      title: p.title ? p.title.trim() : 'Untitled Project',
      desc: p.desc ? p.desc.trim() : '',
      githubUrl: p.githubUrl ? p.githubUrl.trim() : (p.github || p.repo || ''),
    }));

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
      projects: sanitizedProjects,
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
        avatarUrl: portfolio.avatarSeed.startsWith('/uploads/') ? portfolio.avatarSeed : (req.user.avatarUrl || ''),
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
