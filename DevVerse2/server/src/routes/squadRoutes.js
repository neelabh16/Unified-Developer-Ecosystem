// =============================================================================
// Squad Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const squadController = require('../controllers/squadController');
const { protect } = require('../middleware/auth');
const csrfProtection = require('../middleware/csrf');

router.use(protect); // All squad operations require authentication

router.get('/mine', squadController.getMySquads);
router.post('/', csrfProtection, squadController.createSquad);
router.delete('/:id/leave', csrfProtection, squadController.leaveSquad);
router.post('/:id/members', csrfProtection, squadController.addSquadMember);
router.post('/:id/hackathons/:hackathonId', csrfProtection, squadController.registerSquadHackathon);
router.get('/matches', squadController.getSquadMatches);

module.exports = router;
