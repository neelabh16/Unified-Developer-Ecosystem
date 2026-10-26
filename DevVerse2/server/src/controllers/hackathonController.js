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

/**
 * List all hackathons with registration and bookmark flags for current user.
 * GET /api/v1/hackathons
 */
const getHackathons = async (req, res, next) => {
  try {
    const hackathons = await Hackathon.find().sort({ end: 1 });

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
    return sendSuccess(
      res,
      200,
      registered ? 'Registered for hackathon' : 'Registration cancelled',
      {
        registered,
        participantsCount: updated.participantsCount,
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
