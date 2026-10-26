// =============================================================================
// Discussion Controller (Threads & Replies)
// =============================================================================
const Discussion = require('../models/Discussion');
const Engagement = require('../models/Engagement');
const User = require('../models/User');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * List recent discussions across all communities.
 * GET /api/v1/discussions
 */
const getAllDiscussions = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const discussions = await Discussion.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate('community', 'name slug gradient')
      .populate('author', 'name username avatarSeed points');

    return sendSuccess(res, 200, 'Recent discussions retrieved', { discussions });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single discussion by ID with replies.
 * GET /api/v1/discussions/:id
 */
const getDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const discussion = await Discussion.findById(id)
      .populate('community', 'name slug gradient')
      .populate('author', 'name username avatarSeed points')
      .populate('replies.author', 'name username avatarSeed points');

    if (!discussion) {
      return next(new AppError('Discussion not found', 404));
    }

    return sendSuccess(res, 200, 'Discussion retrieved', { discussion });
  } catch (error) {
    next(error);
  }
};

/**
 * Update discussion title or body — author only.
 * PUT /api/v1/discussions/:id
 */
const updateDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, body } = req.body;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return next(new AppError('Discussion not found', 404));
    }

    if (discussion.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to edit this discussion.', 403));
    }

    if (title) discussion.title = title.trim();
    if (body) discussion.body = body.trim();
    await discussion.save();

    return sendSuccess(res, 200, 'Discussion updated successfully', { discussion });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete discussion thread — author only.
 * DELETE /api/v1/discussions/:id
 */
const deleteDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return next(new AppError('Discussion not found', 404));
    }

    if (discussion.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this discussion.', 403));
    }

    await Discussion.deleteOne({ _id: id });
    return sendSuccess(res, 200, 'Discussion deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add a reply to a discussion thread.
 * POST /api/v1/discussions/:id/replies
 */
const addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return next(new AppError('Reply text is required.', 400));
    }

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return next(new AppError('Discussion not found', 404));
    }

    // Verify membership in the parent community
    const isMember = await Engagement.findOne({
      user: req.user._id,
      type: 'join',
      targetType: 'community',
      targetId: discussion.community.toString(),
    });

    if (!isMember && req.user.role !== 'admin') {
      return next(new AppError('You must join this community before replying to discussions.', 403));
    }

    const newReply = {
      author: req.user._id,
      authorHandle: req.user.username,
      authorName: req.user.name,
      text: text.trim(),
    };

    discussion.replies.push(newReply);
    discussion.repliesCount = discussion.replies.length;
    await discussion.save();

    // Award 10 points for replying to discussion
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } });
    await Activity.create({
      user: req.user._id,
      amount: 10,
      reason: `Replied to discussion "${discussion.title}"`,
      bucket: 'reply',
      entityId: discussion._id.toString(),
    });

    return sendSuccess(res, 201, 'Reply posted successfully', {
      reply: discussion.replies[discussion.replies.length - 1],
      repliesCount: discussion.repliesCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a reply — author only.
 * DELETE /api/v1/discussions/:id/replies/:replyId
 */
const deleteReply = async (req, res, next) => {
  try {
    const { id, replyId } = req.params;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return next(new AppError('Discussion not found', 404));
    }

    const reply = discussion.replies.id(replyId);
    if (!reply) {
      return next(new AppError('Reply not found', 404));
    }

    if (reply.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this reply.', 403));
    }

    reply.deleteOne();
    discussion.repliesCount = discussion.replies.length;
    await discussion.save();

    return sendSuccess(res, 200, 'Reply deleted successfully', {
      repliesCount: discussion.repliesCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDiscussions,
  getDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  deleteReply,
};
