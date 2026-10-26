// =============================================================================
// CodexEntry Model
// =============================================================================
const mongoose = require('mongoose');

const codexEntrySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Entry title is required'],
      trim: true,
      minlength: [8, 'Title must be at least 8 characters'],
      maxlength: [160, 'Title cannot exceed 160 characters'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Debugging',
        'Performance',
        'Architecture',
        'Incidents',
        'Career',
        'Solo Building',
        'Security',
        'Other',
      ],
      index: true,
    },
    problem: {
      type: String,
      required: [true, 'Problem description is required'],
      trim: true,
      minlength: [20, 'Problem must be at least 20 characters'],
      maxlength: [3000, 'Problem cannot exceed 3000 characters'],
    },
    tried: {
      type: String,
      required: [true, 'What was tried is required'],
      trim: true,
      minlength: [10, 'What was tried must be at least 10 characters'],
      maxlength: [3000, 'What was tried cannot exceed 3000 characters'],
    },
    fix: {
      type: String,
      required: [true, 'The fix is required'],
      trim: true,
      minlength: [10, 'The fix must be at least 10 characters'],
      maxlength: [3000, 'The fix cannot exceed 3000 characters'],
    },
    lesson: {
      type: String,
      required: [true, 'The lesson is required'],
      trim: true,
      minlength: [10, 'The lesson must be at least 10 characters'],
      maxlength: [3000, 'The lesson cannot exceed 3000 characters'],
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
  },
  {
    timestamps: true,
  }
);

codexEntrySchema.index({ title: 'text', problem: 'text', lesson: 'text' });
codexEntrySchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('CodexEntry', codexEntrySchema);
