// =============================================================================
// Upload Controller
// =============================================================================
const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

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

    // Update user record and portfolio record if user is logged in
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(req.user._id, {
        avatarSeed: fileUrl,
      });
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        await Portfolio.findOneAndUpdate(
          { user: req.user._id },
          { $set: { avatarSeed: fileUrl } }
        ).catch(() => {});
      }
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

/**
 * Upload a generic image (e.g. for project gallery/screenshots).
 * POST /api/v1/uploads/image
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided.', 400));
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return sendSuccess(res, 201, 'Image uploaded successfully', {
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
  uploadImage,
};
