// =============================================================================
// Community Controller
// =============================================================================
const mongoose = require('mongoose');
const Community = require('../models/Community');
const Discussion = require('../models/Discussion');
const Engagement = require('../models/Engagement');
const User = require('../models/User');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

const REALISTIC_COMMUNITY_COUNTS = {
  c1: { membersCount: 5, onlineCount: 1 },
  'rustaceans-guild': { membersCount: 5, onlineCount: 1 },
  c2: { membersCount: 6, onlineCount: 2 },
  'frontend-atelier': { membersCount: 6, onlineCount: 2 },
  c3: { membersCount: 4, onlineCount: 1 },
  'distributed-systems-lab': { membersCount: 4, onlineCount: 1 },
  c4: { membersCount: 4, onlineCount: 1 },
  'ml-practitioners': { membersCount: 4, onlineCount: 1 },
  c5: { membersCount: 7, onlineCount: 2 },
  'indie-hackers-dev': { membersCount: 7, onlineCount: 2 },
  c6: { membersCount: 3, onlineCount: 1 },
  'webgl-shaders': { membersCount: 3, onlineCount: 1 },
  c7: { membersCount: 5, onlineCount: 1 },
  'cloud-native-ops': { membersCount: 5, onlineCount: 1 },
  c8: { membersCount: 4, onlineCount: 1 },
  'security-and-crypto': { membersCount: 4, onlineCount: 1 },
  c9: { membersCount: 4, onlineCount: 1 },
  'mobile-craft': { membersCount: 4, onlineCount: 1 },
  c10: { membersCount: 5, onlineCount: 1 },
  'apis-and-protocols': { membersCount: 5, onlineCount: 1 },
};

/**
 * List all communities with online & member counts.
 * GET /api/v1/communities
 */
const getCommunities = async (req, res, next) => {
  try {
    const rawCommunities = await Community.find().sort({ membersCount: -1 });

    const communities = await Promise.all(
      rawCommunities.map(async (c) => {
        const cObj = c.toObject ? c.toObject() : c;
        if (cObj.membersCount > 11) {
          const fallback =
            REALISTIC_COMMUNITY_COUNTS[cObj.legacyId] ||
            REALISTIC_COMMUNITY_COUNTS[cObj.slug] || { membersCount: 5, onlineCount: 1 };
          cObj.membersCount = fallback.membersCount;
          cObj.onlineCount = fallback.onlineCount;
          Community.findByIdAndUpdate(c._id, {
            membersCount: fallback.membersCount,
            onlineCount: fallback.onlineCount,
          }).catch(() => {});
        }
        return cObj;
      })
    );

    let joinedIds = [];
    if (req.user) {
      const joins = await Engagement.find({
        user: req.user._id,
        type: 'join',
        targetType: 'community',
      });
      joinedIds = joins.map((j) => j.targetId);
    }

    return sendSuccess(res, 200, 'Communities retrieved', {
      communities,
      joinedIds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get community details by id or slug.
 * GET /api/v1/communities/:id
 */
const getCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;

    let community = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      community = await Community.findById(id);
    }
    if (!community) {
      community = await Community.findOne({ $or: [{ slug: id }, { legacyId: id }] });
    }

    if (!community) {
      return next(new AppError('Community not found', 404));
    }

    if (community.membersCount > 11) {
      const fallback =
        REALISTIC_COMMUNITY_COUNTS[community.legacyId] ||
        REALISTIC_COMMUNITY_COUNTS[community.slug] || { membersCount: 5, onlineCount: 1 };
      community.membersCount = fallback.membersCount;
      community.onlineCount = fallback.onlineCount;
      await Community.findByIdAndUpdate(community._id, {
        membersCount: fallback.membersCount,
        onlineCount: fallback.onlineCount,
      });
    }

    let isMember = false;
    if (req.user) {
      const membership = await Engagement.findOne({
        user: req.user._id,
        type: 'join',
        targetType: 'community',
        targetId: community._id.toString(),
      });
      isMember = !!membership;
    }

    return sendSuccess(res, 200, 'Community details retrieved', {
      community,
      isMember,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle join/leave community membership.
 * POST /api/v1/communities/:id/join
 */
const toggleJoin = async (req, res, next) => {
  try {
    const { id } = req.params;

    let community = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      community = await Community.findById(id);
    }
    if (!community) {
      community = await Community.findOne({ $or: [{ slug: id }, { legacyId: id }] });
    }

    if (!community) {
      return next(new AppError('Community not found', 404));
    }

    if (community.membersCount > 11) {
      const fallback =
        REALISTIC_COMMUNITY_COUNTS[community.legacyId] ||
        REALISTIC_COMMUNITY_COUNTS[community.slug] || { membersCount: 5, onlineCount: 1 };
      community.membersCount = fallback.membersCount;
      community.onlineCount = fallback.onlineCount;
      await Community.findByIdAndUpdate(community._id, {
        membersCount: fallback.membersCount,
        onlineCount: fallback.onlineCount,
      });
    }

    const targetId = community._id.toString();
    const existing = await Engagement.findOne({
      user: req.user._id,
      type: 'join',
      targetType: 'community',
      targetId,
    });

    let joined = false;
    if (existing) {
      // Leave
      await Engagement.deleteOne({ _id: existing._id });
      await Community.findByIdAndUpdate(community._id, { $inc: { membersCount: -1 } });
      joined = false;
    } else {
      // Join
      await Engagement.create({
        user: req.user._id,
        type: 'join',
        targetType: 'community',
        targetId,
      });
      await Community.findByIdAndUpdate(community._id, { $inc: { membersCount: 1 } });
      joined = true;

      // Award 5 points for joining community
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: 5 } });
      await Activity.create({
        user: req.user._id,
        amount: 5,
        reason: `Joined ${community.name}`,
        bucket: 'join',
        entityId: targetId,
      });
    }

    const updated = await Community.findById(community._id);
    return sendSuccess(res, 200, joined ? `Joined ${community.name}` : `Left ${community.name}`, {
      joined,
      membersCount: updated.membersCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get forum threads / discussions for a specific community.
 * GET /api/v1/communities/:id/discussions
 */
const getCommunityDiscussions = async (req, res, next) => {
  try {
    const { id } = req.params;

    let community = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      community = await Community.findById(id);
    }
    if (!community) {
      community = await Community.findOne({ $or: [{ slug: id }, { legacyId: id }] });
    }

    if (!community) {
      return next(new AppError('Community not found', 404));
    }

    const discussions = await Discussion.find({ community: community._id })
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatarSeed points');

    return sendSuccess(res, 200, 'Discussions retrieved', { discussions });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new discussion thread in a community.
 * POST /api/v1/communities/:id/discussions
 */
const createCommunityDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, body } = req.body;

    if (!title || !body) {
      return next(new AppError('Title and body are required for discussions.', 400));
    }

    let community = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      community = await Community.findById(id);
    }
    if (!community) {
      community = await Community.findOne({ $or: [{ slug: id }, { legacyId: id }] });
    }

    if (!community) {
      return next(new AppError('Community not found', 404));
    }

    // Verify user is a member of the community
    const isMember = await Engagement.findOne({
      user: req.user._id,
      type: 'join',
      targetType: 'community',
      targetId: community._id.toString(),
    });

    if (!isMember && req.user.role !== 'admin') {
      return next(new AppError('You must join this community before posting discussions.', 403));
    }

    const discussion = await Discussion.create({
      community: community._id,
      communitySlug: community.slug,
      title: title.trim(),
      body: body.trim(),
      author: req.user._id,
      authorHandle: req.user.username,
      authorName: req.user.name,
      replies: [],
      repliesCount: 0,
    });

    // Award 25 points for starting a discussion
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 25 } });
    await Activity.create({
      user: req.user._id,
      amount: 25,
      reason: `Started discussion "${discussion.title}" in ${community.name}`,
      bucket: 'thread',
      entityId: discussion._id.toString(),
    });

    return sendSuccess(res, 201, 'Discussion thread created', { discussion });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCommunities,
  getCommunity,
  toggleJoin,
  getCommunityDiscussions,
  createCommunityDiscussion,
};
