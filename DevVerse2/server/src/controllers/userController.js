// =============================================================================
// User Controller
// =============================================================================
const User = require('../models/User');
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

    return sendSuccess(res, 200, 'User profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user's profile (name, bio, avatarSeed, settings).
 * PUT /api/v1/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatarSeed, settings, skills } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatarSeed !== undefined) updates.avatarSeed = avatarSeed.trim();
    if (skills !== undefined && Array.isArray(skills)) updates.skills = skills;
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

module.exports = {
  getProfile,
  updateProfile,
  updateUsername,
};
