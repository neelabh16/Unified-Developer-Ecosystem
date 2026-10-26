// =============================================================================
// Project Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect, optionalAuth } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');
const { validateIdParams } = require('../middleware/validateObjectId');

router.param('id', (req, res, next, val) => {
  if (typeof val !== 'string' || /[${}]/.test(val)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  next();
});

// Public project browsing
router.get('/', projectController.getProjects);
router.get('/:id', optionalAuth, projectController.getProject);
router.post('/:id/view', projectController.trackView);

// Comments
router.get('/:id/comments', projectController.getComments);
router.post('/:id/comments', protect, csrfProtection, projectController.addComment);
router.delete('/:id/comments/:commentId', protect, csrfProtection, projectController.deleteComment);

// Protected actions (Create, Update, Delete, Like, Bookmark)
router.post('/', protect, csrfProtection, projectController.createProject);
router.put('/:id', protect, csrfProtection, projectController.updateProject);
router.delete('/:id', protect, csrfProtection, projectController.deleteProject);
router.post('/:id/like', protect, csrfProtection, projectController.toggleLike);
router.post('/:id/bookmark', protect, csrfProtection, projectController.toggleBookmark);

module.exports = router;
