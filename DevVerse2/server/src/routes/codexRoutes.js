// =============================================================================
// Codex Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const codexController = require('../controllers/codexController');
const { protect, optionalAuth } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');

router.get('/', optionalAuth, codexController.getCodexEntries);
router.get('/status', optionalAuth, codexController.getCodexStatus);
router.get('/:id', optionalAuth, codexController.getCodexEntry);
router.post('/', protect, csrfProtection, codexController.createCodexEntry);
router.put('/:id', protect, csrfProtection, codexController.updateCodexEntry);
router.delete('/:id', protect, csrfProtection, codexController.deleteCodexEntry);

module.exports = router;
