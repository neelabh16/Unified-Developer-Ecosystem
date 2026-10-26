// =============================================================================
// Message Model
// =============================================================================
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderHandle: {
      type: String,
      required: true,
    },
    recipientHandle: {
      type: String,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      minlength: [1, 'Message cannot be empty'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ senderHandle: 1, recipientHandle: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
