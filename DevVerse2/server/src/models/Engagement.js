// =============================================================================
// Engagement (Likes, Bookmarks, Following, Joins, Comments) Model
// =============================================================================
const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['like', 'bookmark', 'follow', 'join', 'comment'],
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['project', 'hackathon', 'user', 'community'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    // Optional comment payload if type === 'comment'
    content: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index for idempotent likes, bookmarks, follows, joins
// (A user can only like/bookmark/follow/join a specific target once)
engagementSchema.index(
  { user: 1, type: 1, targetType: 1, targetId: 1 },
  {
    unique: true,
    partialFilterExpression: { type: { $in: ['like', 'bookmark', 'follow', 'join'] } },
  }
);

module.exports = mongoose.model('Engagement', engagementSchema);
