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

    return sendSuccess(res, 200, 'Bookmarks retrieved', {
      projectIds,
      hackathonIds,
      projects,
      hackathons,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBookmarks,
};
