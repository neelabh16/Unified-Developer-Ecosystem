// =============================================================================
// Activity (Points Log & Event) Model
// =============================================================================
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    bucket: {
      type: String,
      enum: [
        'like',
        'bookmark',
        'follow',
        'join',
        'register',
        'comment',
        'thread',
        'reply',
        'message',
        'squadFormed',
        'squadRegister',
        'codexEntry',
        'projectSubmit',
        'milestone',
        'squadHackathon',
      ],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
