// =============================================================================
// Hackathon Controller
// =============================================================================
const mongoose = require('mongoose');
const Hackathon = require('../models/Hackathon');
const HackathonRegistration = require('../models/HackathonRegistration');
const Engagement = require('../models/Engagement');
const User = require('../models/User');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

const DEFAULT_DEVVERSE_PARTICIPANTS = {
  h1: ['sena.codes', 'ari-devs', 'kmori'],
  'aurora-hacks-2026': ['sena.codes', 'ari-devs', 'kmori'],
  h2: ['kmori', 'dax'],
  'systems-underground': ['kmori', 'dax'],
  h3: ['noa.ml', 'sena.codes', 'devon.codes'],
  'ai-for-builders': ['noa.ml', 'sena.codes', 'devon.codes'],
  h4: ['lumen', 'ari-devs', 'priya.dev'],
  'pixel-and-motion': ['lumen', 'ari-devs', 'priya.dev'],
  h5: ['elena-v', 'kmori'],
  'edge-cloud-sprint': ['elena-v', 'kmori'],
  h6: ['marcus-k', 'dax'],
  'zero-knowledge-jam': ['marcus-k', 'dax'],
  h7: ['dax', 'devon.codes', 'priya.dev'],
  'open-source-revival': ['dax', 'devon.codes', 'priya.dev'],
  h8: ['ari-devs', 'devon.codes'],
  'mobile-first-odyssey': ['ari-devs', 'devon.codes'],
  h9: ['lumen', 'noa.ml'],
  'browser-game-jam': ['lumen', 'noa.ml'],
  h10: ['marcus-k', 'elena-v'],
  'cyber-defense-crucible': ['marcus-k', 'elena-v'],
};

/**
 * List all hackathons with registration and bookmark flags for current user.
 * GET /api/v1/hackathons
 */
const getHackathons = async (req, res, next) => {
  try {
    const rawHackathons = await Hackathon.find().sort({ end: 1 });

    const allRegistrations = await HackathonRegistration.find()
      .populate('user', 'name username avatarSeed avatarUrl bio points skills');

    const regByHackathon = {};
    for (const r of allRegistrations) {
      if (!r.user) continue;
      const hid = r.hackathon.toString();
      if (!regByHackathon[hid]) regByHackathon[hid] = [];
      regByHackathon[hid].push(r.user);
    }

    const hackathons = await Promise.all(
      rawHackathons.map(async (h) => {
        const hObj = h.toObject ? h.toObject() : h;
        let regs = regByHackathon[h._id.toString()] || [];
        if (!regs.length) {
          const handles =
            DEFAULT_DEVVERSE_PARTICIPANTS[hObj.legacyId] ||
            DEFAULT_DEVVERSE_PARTICIPANTS[hObj.id] || ['kmori', 'sena.codes'];
          const seededUsers = await User.find({ username: { $in: handles } }).select(
            'name username avatarSeed avatarUrl bio points skills'
          );
          regs = seededUsers;
          for (const su of seededUsers) {
            HackathonRegistration.create({ user: su._id, hackathon: h._id }).catch(() => {});
          }
        }
        hObj.devverseParticipants = regs;
        hObj.devverseCount = regs.length;
        return hObj;
      })
    );

    let registeredIds = [];
    let bookmarkedIds = [];

    if (req.user) {
      const registrations = await HackathonRegistration.find({ user: req.user._id });
      registeredIds = registrations.map((r) => r.hackathon.toString());

      const bookmarks = await Engagement.find({
        user: req.user._id,
        type: 'bookmark',
        targetType: 'hackathon',
      });
      bookmarkedIds = bookmarks.map((b) => b.targetId);
    }

    return sendSuccess(res, 200, 'Hackathons retrieved', {
      hackathons,
      registeredIds,
      bookmarkedIds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single hackathon details by id or legacyId.
 * GET /api/v1/hackathons/:id
 */
const getHackathon = async (req, res, next) => {
  try {
    const { id } = req.params;

    let hackathon = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      hackathon = await Hackathon.findById(id);
    }
    if (!hackathon) {
      hackathon = await Hackathon.findOne({ legacyId: id });
    }

    if (!hackathon) {
      return next(new AppError('Hackathon not found', 404));
    }

    let registrations = await HackathonRegistration.find({ hackathon: hackathon._id })
      .populate('user', 'name username avatarSeed avatarUrl bio points skills');

    let devverseParticipants = registrations.map((r) => r.user).filter(Boolean);
    if (!devverseParticipants.length) {
      const handles =
        DEFAULT_DEVVERSE_PARTICIPANTS[hackathon.legacyId] || ['kmori', 'sena.codes'];
      const seededUsers = await User.find({ username: { $in: handles } }).select(
        'name username avatarSeed avatarUrl bio points skills'
      );
      devverseParticipants = seededUsers;
      for (const su of seededUsers) {
        HackathonRegistration.create({ user: su._id, hackathon: hackathon._id }).catch(() => {});
      }
    }

    let isRegistered = false;
    let isBookmarked = false;

    if (req.user) {
      const reg = await HackathonRegistration.findOne({
        user: req.user._id,
        hackathon: hackathon._id,
      });
      isRegistered = !!reg;

      const bm = await Engagement.findOne({
        user: req.user._id,
        type: 'bookmark',
        targetType: 'hackathon',
        targetId: hackathon._id.toString(),
      });
      isBookmarked = !!bm;
    }

    return sendSuccess(res, 200, 'Hackathon details retrieved', {
      hackathon,
      devverseParticipants,
      isRegistered,
      isBookmarked,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user registration for a hackathon.
 * POST /api/v1/hackathons/:id/register
 */
const toggleRegister = async (req, res, next) => {
  try {
    const { id } = req.params;

    let hackathon = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      hackathon = await Hackathon.findById(id);
    }
    if (!hackathon) {
      hackathon = await Hackathon.findOne({ legacyId: id });
    }

    if (!hackathon) {
      return next(new AppError('Hackathon not found', 404));
    }

    const existingReg = await HackathonRegistration.findOne({
      user: req.user._id,
      hackathon: hackathon._id,
    });

    let registered = false;
    if (existingReg) {
      // Unregister
      await HackathonRegistration.deleteOne({ _id: existingReg._id });
      await Hackathon.findByIdAndUpdate(hackathon._id, { $inc: { participantsCount: -1 } });
      registered = false;
    } else {
      // Register
      await HackathonRegistration.create({
        user: req.user._id,
        hackathon: hackathon._id,
      });
      await Hackathon.findByIdAndUpdate(hackathon._id, { $inc: { participantsCount: 1 } });
      registered = true;

      // Award 20 points for hackathon registration
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: 20 } });
      await Activity.create({
        user: req.user._id,
        amount: 20,
        reason: `Registered for "${hackathon.title}"`,
        bucket: 'register',
        entityId: hackathon._id.toString(),
      });
    }

    const updated = await Hackathon.findById(hackathon._id);
    const devverseCount = await HackathonRegistration.countDocuments({ hackathon: hackathon._id });
    return sendSuccess(
      res,
      200,
      registered ? 'Registered for hackathon' : 'Registration cancelled',
      {
        registered,
        participantsCount: updated.participantsCount,
        devverseCount,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle bookmark for a hackathon.
 * POST /api/v1/hackathons/:id/bookmark
 */
const toggleBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;

    let hackathon = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      hackathon = await Hackathon.findById(id);
    }
    if (!hackathon) {
      hackathon = await Hackathon.findOne({ legacyId: id });
    }

    if (!hackathon) {
      return next(new AppError('Hackathon not found', 404));
    }

    const targetId = hackathon._id.toString();
    const existing = await Engagement.findOne({
      user: req.user._id,
      type: 'bookmark',
      targetType: 'hackathon',
      targetId,
    });

    let bookmarked = false;
    if (existing) {
      await Engagement.deleteOne({ _id: existing._id });
      bookmarked = false;
    } else {
      await Engagement.create({
        user: req.user._id,
        type: 'bookmark',
        targetType: 'hackathon',
        targetId,
      });
      bookmarked = true;

      await User.findByIdAndUpdate(req.user._id, { $inc: { points: 3 } });
      await Activity.create({
        user: req.user._id,
        amount: 3,
        reason: `Bookmarked hackathon "${hackathon.title}"`,
        bucket: 'bookmark',
        entityId: targetId,
      });
    }

    return sendSuccess(res, 200, bookmarked ? 'Hackathon bookmarked' : 'Bookmark removed', {
      bookmarked,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHackathons,
  getHackathon,
  toggleRegister,
  toggleBookmark,
};
