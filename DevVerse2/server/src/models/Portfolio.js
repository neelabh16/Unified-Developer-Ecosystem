// =============================================================================
// Portfolio Model
// =============================================================================
const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    handle: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    avatarSeed: {
      type: String,
      default: 'you-builder',
    },
    accent: {
      type: String,
      default: '#7c6fff',
    },
    skills: {
      type: [String],
      default: [],
    },
    links: [
      {
        label: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    projects: [
      {
        title: { type: String, required: true },
        desc: { type: String, default: '' },
        githubUrl: { type: String, trim: true, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Portfolio', portfolioSchema);
