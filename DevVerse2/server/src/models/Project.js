// =============================================================================
// Project Model
// =============================================================================
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [80, 'Title cannot exceed 80 characters'],
      index: true,
    },
    desc: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorHandle: {
      type: String,
      required: true,
      index: true,
    },
    art: {
      type: String,
      default: 'project-1.png',
    },
    gradient: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true,
      index: true,
    },
    githubUrl: {
      type: String,
      trim: true,
      default: null,
    },
    features: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    timeline: [
      {
        label: { type: String, required: true },
        when: { type: String, required: true },
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    isSeeded: {
      type: Boolean,
      default: false,
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

// Compound text index for project search
projectSchema.index({ title: 'text', desc: 'text', tags: 'text' });
projectSchema.index({ category: 1, difficulty: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
