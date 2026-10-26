// =============================================================================
// Community Model
// =============================================================================
const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Community name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    desc: {
      type: String,
      required: [true, 'Community description is required'],
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    gradient: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    membersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    onlineCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    legacyId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Community', communitySchema);
