// =============================================================================
// Hackathon Model
// =============================================================================
const mongoose = require('mongoose');

const hackathonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Hackathon title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      index: true,
    },
    desc: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    longDesc: {
      type: String,
      required: true,
      trim: true,
    },
    prize: {
      type: String,
      required: true,
      default: '$10,000',
    },
    participantsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ['Beginner friendly', 'Intermediate', 'Advanced', 'All levels'],
      default: 'All levels',
    },
    end: {
      type: Date,
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    organizer: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      default: 'Online · Global',
    },
    gradient: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    tracks: {
      type: [String],
      default: [],
    },
    timeline: [
      {
        label: { type: String, required: true },
        when: { type: String, required: true },
      },
    ],
    rules: {
      type: [String],
      default: [],
    },
    judging: [
      {
        criteria: { type: String, required: true },
        weight: { type: String, required: true },
      },
    ],
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

hackathonSchema.index({ end: 1 });

module.exports = mongoose.model('Hackathon', hackathonSchema);
