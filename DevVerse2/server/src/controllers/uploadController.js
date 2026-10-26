// =============================================================================
// Upload Controller
// =============================================================================
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/AppError');
const User = require('../models/User');

/**
 * Upload an avatar or profile image.
 * POST /api/v1/uploads/avatar
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided.', 400));
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    // Update user record if user is logged in
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(req.user._id, {
        avatarSeed: fileUrl,
      });
    }

    return sendSuccess(res, 201, 'Avatar image uploaded successfully', {
      filename: req.file.filename,
      url: fileUrl,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAvatar,
};
