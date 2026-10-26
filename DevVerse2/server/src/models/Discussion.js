// =============================================================================
// Discussion (Forum Thread) Model
// =============================================================================
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      required: [true, 'Reply text is required'],
      trim: true,
      minlength: [2, 'Reply must be at least 2 characters'],
      maxlength: [2000, 'Reply cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const discussionSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      index: true,
    },
    communitySlug: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Thread title is required'],
      trim: true,
      minlength: [6, 'Title must be at least 6 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    body: {
      type: String,
      required: [true, 'Thread body is required'],
      trim: true,
      minlength: [12, 'Body must be at least 12 characters'],
      maxlength: [5000, 'Body cannot exceed 5000 characters'],
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
    replies: [replySchema],
    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

discussionSchema.index({ community: 1, createdAt: -1 });

module.exports = mongoose.model('Discussion', discussionSchema);
