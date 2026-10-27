// =============================================================================
// Bookmark Controller
// =============================================================================
const Engagement = require('../models/Engagement');
const Project = require('../models/Project');
const Hackathon = require('../models/Hackathon');
const { sendSuccess } = require('../utils/response');

/**
 * Get all bookmarked projects and hackathons for the current user.
 * GET /api/v1/bookmarks
 */
const getMyBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Engagement.find({
      user: req.user._id,
      type: 'bookmark',
    });

    const projectIds = bookmarks
      .filter((b) => b.targetType === 'project')
      .map((b) => b.targetId);

    const hackathonIds = bookmarks
      .filter((b) => b.targetType === 'hackathon')
      .map((b) => b.targetId);

    const projects = await Project.find({ _id: { $in: projectIds } }).populate(
      'author',
      'name username avatarSeed'
    );
    const hackathons = await Hackathon.find({ _id: { $in: hackathonIds } });

    // Include both ObjectId and legacyId so frontend can match 'p1' as well as '_id'
    const allProjectKeys = [];
    projects.forEach((p) => {
      allProjectKeys.push(p._id.toString());
      if (p.legacyId) allProjectKeys.push(p.legacyId);
    });
    projectIds.forEach((id) => {
      if (!allProjectKeys.includes(id)) allProjectKeys.push(id);
    });

    const allHackathonKeys = [];
    hackathons.forEach((h) => {
      allHackathonKeys.push(h._id.toString());
      if (h.legacyId) allHackathonKeys.push(h.legacyId);
    });
    hackathonIds.forEach((id) => {
      if (!allHackathonKeys.includes(id)) allHackathonKeys.push(id);
    });

    return sendSuccess(res, 200, 'Bookmarks retrieved', {
      projectIds: allProjectKeys,
      hackathonIds: allHackathonKeys,
      projects,
      hackathons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all liked projects for the current user.
 * GET /api/v1/bookmarks/likes
 */
const getMyLikes = async (req, res, next) => {
  try {
    const likes = await Engagement.find({
      user: req.user._id,
      type: 'like',
      targetType: 'project',
    });

    const targetIds = likes.map((l) => l.targetId);
    const projects = await Project.find({ _id: { $in: targetIds } }).populate(
      'author',
      'name username avatarSeed'
    );

    const allProjectKeys = [];
    projects.forEach((p) => {
      allProjectKeys.push(p._id.toString());
      if (p.legacyId) allProjectKeys.push(p.legacyId);
    });
    targetIds.forEach((id) => {
      if (!allProjectKeys.includes(id)) allProjectKeys.push(id);
    });

    return sendSuccess(res, 200, 'Likes retrieved', {
      projectIds: allProjectKeys,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBookmarks,
  getMyLikes,
};
