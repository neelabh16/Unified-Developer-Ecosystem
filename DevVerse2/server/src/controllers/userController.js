// =============================================================================
// User Controller
// =============================================================================
const User = require('../models/User');
const Engagement = require('../models/Engagement');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * Get user profile by username.
 * GET /api/v1/users/:username
 */
const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return next(new AppError(`User @${username} not found.`, 404));
    }

    let isFollowing = false;
    if (req.user) {
      const follow = await Engagement.findOne({
        user: req.user._id,
        type: 'follow',
        targetType: 'user',
        targetId: user._id.toString(),
      });
      isFollowing = !!follow;
    }

    const followersCount = await Engagement.countDocuments({
      type: 'follow',
      targetType: 'user',
      targetId: user._id.toString(),
    });

    const followingCount = await Engagement.countDocuments({
      user: user._id,
      type: 'follow',
      targetType: 'user',
    });

    return sendSuccess(res, 200, 'User profile retrieved', {
      user,
      isFollowing,
      followersCount,
      followingCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user's profile (name, bio, avatarSeed, settings, skills).
 * PUT /api/v1/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatarSeed, settings, skills, squadFinderProfile } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatarSeed !== undefined) updates.avatarSeed = avatarSeed.trim();
    if (skills !== undefined && Array.isArray(skills)) updates.skills = skills;
    if (squadFinderProfile && typeof squadFinderProfile === 'object') {
      updates.squadFinderProfile = squadFinderProfile;
    }
    if (settings && typeof settings === 'object') {
      if (settings.theme) updates['settings.theme'] = settings.theme;
      if (settings.accent) updates['settings.accent'] = settings.accent;
      if (settings.motion) updates['settings.motion'] = settings.motion;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return sendSuccess(res, 200, 'Profile updated successfully', { user: updatedUser });
  } catch (error) {
    next(error);
  }
};

/**
 * One-time username change (requires Legend tier >= 600 pts).
 * PUT /api/v1/users/username
 */
const updateUsername = async (req, res, next) => {
  try {
    const { newUsername } = req.body;

    if (!newUsername) {
      return next(new AppError('Please provide a new username.', 400));
    }

    const cleaned = newUsername.trim().toLowerCase();
    const user = await User.findById(req.user._id);

    if (user.usernameChangeUsed) {
      return next(new AppError('You have already used your one-time username change.', 400));
    }

    if (user.points < 600) {
      return next(
        new AppError('Username change requires Legend tier (at least 600 points).', 403)
      );
    }

    const existing = await User.findOne({ username: cleaned });
    if (existing) {
      return next(new AppError('That username is already taken.', 409));
    }

    user.username = cleaned;
    user.usernameChangeUsed = true;
    await user.save();

    return sendSuccess(res, 200, 'Username updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle follow / unfollow developer.
 * POST /api/v1/users/:username/follow
 */
const toggleFollow = async (req, res, next) => {
  try {
    const { username } = req.params;
    const targetUser = await User.findOne({ username: username.toLowerCase() });

    if (!targetUser) {
      return next(new AppError(`User @${username} not found.`, 404));
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return next(new AppError('You cannot follow yourself.', 400));
    }

    const targetId = targetUser._id.toString();
    const existing = await Engagement.findOne({
      user: req.user._id,
      type: 'follow',
      targetType: 'user',
      targetId,
    });

    let following = false;
    if (existing) {
      await Engagement.deleteOne({ _id: existing._id });
      following = false;
    } else {
      await Engagement.create({
        user: req.user._id,
        type: 'follow',
        targetType: 'user',
        targetId,
      });
      following = true;

      // Award 2 points on follow
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: 2 } });
      await Activity.create({
        user: req.user._id,
        amount: 2,
        reason: `Followed @${targetUser.username}`,
        bucket: 'follow',
        entityId: targetId,
      });
    }

    return sendSuccess(res, 200, following ? `Followed @${username}` : `Unfollowed @${username}`, {
      following,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of handles current user follows.
 * GET /api/v1/users/me/following
 */
const getMyFollowing = async (req, res, next) => {
  try {
    const follows = await Engagement.find({
      user: req.user._id,
      type: 'follow',
      targetType: 'user',
    });

    const targetUserIds = follows.map((f) => f.targetId);
    const users = await User.find({ _id: { $in: targetUserIds } }).select(
      'name username avatarSeed bio skills points'
    );

    return sendSuccess(res, 200, 'Following list retrieved', {
      following: users,
      followingHandles: users.map((u) => u.username),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateUsername,
  toggleFollow,
  getMyFollowing,
};
