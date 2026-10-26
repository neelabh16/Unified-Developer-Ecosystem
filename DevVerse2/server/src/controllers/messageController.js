// =============================================================================
// Message Controller (Direct Conversations & Simulated Dev Inboxes)
// =============================================================================
const Message = require('../models/Message');
const User = require('../models/User');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

const CANNED_REPLIES = [
  'Hey! Always down to build something new.',
  'Sounds interesting — tell me more about what you\u2019re thinking?',
  'I\u2019m in. Let\u2019s figure out a hackathon to team up for.',
  'Nice, I\u2019ve been looking for someone to pair with.',
  'Let\u2019s do it — what\u2019s the plan?',
  'I could bring the backend if you\u2019ve got the frontend covered.',
];

/**
 * Get messages between current user and a target handle.
 * GET /api/v1/messages/:handle
 */
const getMessages = async (req, res, next) => {
  try {
    const { handle } = req.params;
    const myHandle = req.user.username;
    const targetHandle = handle.toLowerCase();

    const messages = await Message.find({
      $or: [
        { senderHandle: myHandle, recipientHandle: targetHandle },
        { senderHandle: targetHandle, recipientHandle: myHandle },
      ],
    }).sort({ createdAt: 1 });

    return sendSuccess(res, 200, 'Messages retrieved', { messages });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message to a developer / user.
 * POST /api/v1/messages/:handle
 */
const sendMessage = async (req, res, next) => {
  try {
    const { handle } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return next(new AppError('Message text is required.', 400));
    }

    const myHandle = req.user.username;
    const targetHandle = handle.toLowerCase();

    // Create user message
    const message = await Message.create({
      sender: req.user._id,
      senderHandle: myHandle,
      recipientHandle: targetHandle,
      text: text.trim(),
    });

    // Award 3 points for sending message
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 3 } });
    await Activity.create({
      user: req.user._id,
      amount: 3,
      reason: `Sent message to @${targetHandle}`,
      bucket: 'message',
      entityId: message._id.toString(),
    });

    // If target is one of the seeded developers, auto-generate reply in DB
    const seededDev = await User.findOne({ username: targetHandle });
    if (seededDev && seededDev._id.toString() !== req.user._id.toString()) {
      const replyText = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
      await Message.create({
        sender: seededDev._id,
        senderHandle: targetHandle,
        recipientHandle: myHandle,
        text: replyText,
      });
    }

    const allMessages = await Message.find({
      $or: [
        { senderHandle: myHandle, recipientHandle: targetHandle },
        { senderHandle: targetHandle, recipientHandle: myHandle },
      ],
    }).sort({ createdAt: 1 });

    return sendSuccess(res, 201, 'Message sent successfully', {
      message,
      messages: allMessages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a message — author only.
 * DELETE /api/v1/messages/:handle/:messageId
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    if (message.sender.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this message.', 403));
    }

    await Message.deleteOne({ _id: messageId });
    return sendSuccess(res, 200, 'Message deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage,
};
