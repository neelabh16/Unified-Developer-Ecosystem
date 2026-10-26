// =============================================================================
// Codex Controller
// =============================================================================
const CodexEntry = require('../models/CodexEntry');
const User = require('../models/User');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * List Codex field notes with search and category filter.
 * GET /api/v1/codex
 */
const getCodexEntries = async (req, res, next) => {
  try {
    const { search, category } = req.query;

    const query = {};
    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { problem: regex }, { fix: regex }, { lesson: regex }];
    }

    const entries = await CodexEntry.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatarSeed points');

    return sendSuccess(res, 200, 'Codex entries retrieved', { entries });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Codex unlock status for current user (unlocks at 200 points).
 * GET /api/v1/codex/status
 */
const getCodexStatus = async (req, res, next) => {
  try {
    const points = req.user ? req.user.points : 0;
    const unlocked = points >= 200;

    return sendSuccess(res, 200, 'Codex status checked', {
      unlocked,
      points,
      requiredPoints: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single Codex entry by ID.
 * GET /api/v1/codex/:id
 */
const getCodexEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await CodexEntry.findById(id).populate(
      'author',
      'name username avatarSeed points'
    );

    if (!entry) {
      return next(new AppError('Codex entry not found', 404));
    }

    return sendSuccess(res, 200, 'Codex entry retrieved', { entry });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new Codex field note (Requires 200 points).
 * POST /api/v1/codex
 */
const createCodexEntry = async (req, res, next) => {
  try {
    const { title, category, problem, tried, fix, lesson } = req.body;

    if (!title || !category || !problem || !tried || !fix || !lesson) {
      return next(
        new AppError('All fields (title, category, problem, tried, fix, lesson) are required.', 400)
      );
    }

    // Enforce 200 point unlock threshold
    if (req.user.points < 200 && req.user.role !== 'admin') {
      return next(
        new AppError(
          `Contributing to the Codex requires at least 200 points. You currently have ${req.user.points}.`,
          403
        )
      );
    }

    const entry = await CodexEntry.create({
      title: title.trim(),
      category,
      problem: problem.trim(),
      tried: tried.trim(),
      fix: fix.trim(),
      lesson: lesson.trim(),
      author: req.user._id,
      authorHandle: req.user.username,
    });

    // Award 25 points for Codex contribution
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 25 } });
    await Activity.create({
      user: req.user._id,
      amount: 25,
      reason: `Contributed to the Codex: "${entry.title}"`,
      bucket: 'codexEntry',
      entityId: entry._id.toString(),
    });

    return sendSuccess(res, 201, 'Codex entry created successfully', { entry });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Codex entry — author only.
 * PUT /api/v1/codex/:id
 */
const updateCodexEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await CodexEntry.findById(id);

    if (!entry) {
      return next(new AppError('Codex entry not found', 404));
    }

    if (entry.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to edit this Codex entry.', 403));
    }

    const { title, category, problem, tried, fix, lesson } = req.body;
    if (title) entry.title = title.trim();
    if (category) entry.category = category;
    if (problem) entry.problem = problem.trim();
    if (tried) entry.tried = tried.trim();
    if (fix) entry.fix = fix.trim();
    if (lesson) entry.lesson = lesson.trim();

    await entry.save();
    return sendSuccess(res, 200, 'Codex entry updated successfully', { entry });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Codex entry — author only.
 * DELETE /api/v1/codex/:id
 */
const deleteCodexEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await CodexEntry.findById(id);

    if (!entry) {
      return next(new AppError('Codex entry not found', 404));
    }

    if (entry.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this Codex entry.', 403));
    }

    await CodexEntry.deleteOne({ _id: id });
    return sendSuccess(res, 200, 'Codex entry deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCodexEntries,
  getCodexStatus,
  getCodexEntry,
  createCodexEntry,
  updateCodexEntry,
  deleteCodexEntry,
};
