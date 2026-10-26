// =============================================================================
// Comment Model (for Project Comments)
// =============================================================================
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
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
    },
    authorName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [2, 'Comment must be at least 2 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
