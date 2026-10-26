// =============================================================================
// Project Controller
// =============================================================================
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Engagement = require('../models/Engagement');
const Activity = require('../models/Activity');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * List projects with search, category/difficulty filtering, sorting, and pagination.
 * GET /api/v1/projects
 */
const getProjects = async (req, res, next) => {
  try {
    const { search, category, difficulty, sort = 'trending', page = 1, limit = 50 } = req.query;

    const query = {};

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    // Search query
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { desc: regex }, { tags: regex }];
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'trending' || sort === 'likes') {
      sortOption = { likesCount: -1, createdAt: -1 };
    } else if (sort === 'views') {
      sortOption = { viewsCount: -1, createdAt: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('author', 'name username avatarSeed');

    return sendSuccess(res, 200, 'Projects retrieved successfully', {
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single project by ID or legacyId.
 * GET /api/v1/projects/:id
 */
const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    let project = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      project = await Project.findById(id).populate('author', 'name username avatarSeed points');
    }
    if (!project) {
      project = await Project.findOne({ legacyId: id }).populate('author', 'name username avatarSeed points');
    }

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    return sendSuccess(res, 200, 'Project details retrieved', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Create/submit a new project.
 * POST /api/v1/projects
 */
const createProject = async (req, res, next) => {
  try {
    const { title, desc, category, difficulty, tags, githubUrl, features, timeline } = req.body;

    if (!title || !desc || !category) {
      return next(new AppError('Title, description, and category are required.', 400));
    }

    const parsedTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const parsedFeatures = Array.isArray(features)
      ? features
      : typeof features === 'string'
      ? features.split(',').map((f) => f.trim()).filter(Boolean)
      : [];

    // Card art deterministic picking
    const artPool = ['project-1.png', 'project-2.png', 'project-3.png', 'project-4.png', 'project-5.png'];
    const chosenArt = artPool[Math.floor(Math.random() * artPool.length)];

    const project = await Project.create({
      title: title.trim(),
      desc: desc.trim(),
      category: category.trim(),
      difficulty: difficulty || 'Intermediate',
      tags: parsedTags,
      features: parsedFeatures,
      githubUrl: githubUrl || null,
      timeline: Array.isArray(timeline) ? timeline : [],
      author: req.user._id,
      authorHandle: req.user.username,
      art: chosenArt,
      gradient: Math.floor(Math.random() * 5),
    });

    // Award points (25 points for project submission)
    const pointsAwarded = 25;
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsAwarded } });
    await Activity.create({
      user: req.user._id,
      amount: pointsAwarded,
      reason: `Published "${project.title}" to Explore`,
      bucket: 'projectSubmit',
      entityId: project._id.toString(),
    });

    return sendSuccess(res, 201, 'Project created successfully', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing project (category, title, desc, etc.) — author only.
 * PUT /api/v1/projects/:id
 */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    let project = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      project = await Project.findById(id);
    }
    if (!project) {
      project = await Project.findOne({ legacyId: id });
    }

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Ownership check
    if (project.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to update this project.', 403));
    }

    const { category, title, desc, difficulty, tags, githubUrl } = req.body;
    if (category) project.category = category.trim();
    if (title) project.title = title.trim();
    if (desc) project.desc = desc.trim();
    if (difficulty) project.difficulty = difficulty;
    if (githubUrl !== undefined) project.githubUrl = githubUrl;
    if (tags && Array.isArray(tags)) project.tags = tags;

    await project.save();

    return sendSuccess(res, 200, 'Project updated successfully', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete project — author only.
 * DELETE /api/v1/projects/:id
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    let project = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      project = await Project.findById(id);
    }
    if (!project) {
      project = await Project.findOne({ legacyId: id });
    }

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    if (project.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this project.', 403));
    }

    await Project.deleteOne({ _id: project._id });
    await Comment.deleteMany({ project: project._id });
    await Engagement.deleteMany({ targetType: 'project', targetId: project._id.toString() });

    return sendSuccess(res, 200, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle like for a project.
 * POST /api/v1/projects/:id/like
 */
const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;

    let project = await Project.findById(id);
    if (!project) project = await Project.findOne({ legacyId: id });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const targetId = project._id.toString();
    const existingLike = await Engagement.findOne({
      user: req.user._id,
      type: 'like',
      targetType: 'project',
      targetId,
    });

    let liked = false;
    if (existingLike) {
      // Unlike
      await Engagement.deleteOne({ _id: existingLike._id });
      await Project.findByIdAndUpdate(project._id, { $inc: { likesCount: -1 } });
      liked = false;
    } else {
      // Like
      await Engagement.create({
        user: req.user._id,
        type: 'like',
        targetType: 'project',
        targetId,
      });
      await Project.findByIdAndUpdate(project._id, { $inc: { likesCount: 1 } });
      liked = true;

      // Award points on first-time action
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: 2 } });
      await Activity.create({
        user: req.user._id,
        amount: 2,
        reason: `Liked "${project.title}"`,
        bucket: 'like',
        entityId: targetId,
      });
    }

    const updated = await Project.findById(project._id);
    return sendSuccess(res, 200, liked ? 'Project liked' : 'Project unliked', {
      liked,
      likesCount: updated.likesCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle bookmark for a project.
 * POST /api/v1/projects/:id/bookmark
 */
const toggleBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;

    let project = await Project.findById(id);
    if (!project) project = await Project.findOne({ legacyId: id });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const targetId = project._id.toString();
    const existingBookmark = await Engagement.findOne({
      user: req.user._id,
      type: 'bookmark',
      targetType: 'project',
      targetId,
    });

    let bookmarked = false;
    if (existingBookmark) {
      await Engagement.deleteOne({ _id: existingBookmark._id });
      bookmarked = false;
    } else {
      await Engagement.create({
        user: req.user._id,
        type: 'bookmark',
        targetType: 'project',
        targetId,
      });
      bookmarked = true;

      await User.findByIdAndUpdate(req.user._id, { $inc: { points: 3 } });
      await Activity.create({
        user: req.user._id,
        amount: 3,
        reason: `Bookmarked "${project.title}"`,
        bucket: 'bookmark',
        entityId: targetId,
      });
    }

    return sendSuccess(res, 200, bookmarked ? 'Project bookmarked' : 'Bookmark removed', {
      bookmarked,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track / increment view count for a project.
 * POST /api/v1/projects/:id/view
 */
const trackView = async (req, res, next) => {
  try {
    const { id } = req.params;

    let project = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      project = await Project.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } }, { new: true });
    }
    if (!project) {
      project = await Project.findOneAndUpdate(
        { legacyId: id },
        { $inc: { viewsCount: 1 } },
        { new: true }
      );
    }

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    return sendSuccess(res, 200, 'View tracked', { viewsCount: project.viewsCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Get comments for a project.
 * GET /api/v1/projects/:id/comments
 */
const getComments = async (req, res, next) => {
  try {
    const { id } = req.params;

    let project = await Project.findById(id);
    if (!project) project = await Project.findOne({ legacyId: id });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const comments = await Comment.find({ project: project._id }).sort({ createdAt: 1 });
    return sendSuccess(res, 200, 'Comments retrieved', { comments });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a comment to a project.
 * POST /api/v1/projects/:id/comments
 */
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return next(new AppError('Comment text is required.', 400));
    }

    let project = await Project.findById(id);
    if (!project) project = await Project.findOne({ legacyId: id });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const comment = await Comment.create({
      project: project._id,
      author: req.user._id,
      authorHandle: req.user.username,
      authorName: req.user.name,
      text: text.trim(),
    });

    // Award 15 points for comment
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 15 } });
    await Activity.create({
      user: req.user._id,
      amount: 15,
      reason: `Commented on "${project.title}"`,
      bucket: 'comment',
      entityId: comment._id.toString(),
    });

    return sendSuccess(res, 201, 'Comment added successfully', { comment });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a comment — author only.
 * DELETE /api/v1/projects/:id/comments/:commentId
 */
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this comment.', 403));
    }

    await Comment.deleteOne({ _id: commentId });
    return sendSuccess(res, 200, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  toggleLike,
  toggleBookmark,
  trackView,
  getComments,
  addComment,
  deleteComment,
};
