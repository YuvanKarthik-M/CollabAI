const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  updateTeam,
  joinTeamRequest,
  handleRequestAction,
  getTeamMessages,
  getInviteCandidates,
  sendTeamInvite,
  getMyInvitations,
  handleInvitationAction
} = require('../controllers/teamController');
const protect = require('../middleware/authMiddleware'); //[cite: 1, 2, 3]

router.route('/')
  .get(protect, getTeams)
  .post(protect, createTeam);

router.get('/invitations/me', protect, getMyInvitations);
router.post('/invitations/action', protect, handleInvitationAction);

router.route('/:id')
  .put(protect, updateTeam);

router.get('/:id/candidates', protect, getInviteCandidates);
router.post('/:id/invite', protect, sendTeamInvite);
router.post('/:id/join', protect, joinTeamRequest);
router.post('/requests/action', protect, handleRequestAction);
router.get('/:id/messages', protect, getTeamMessages); // Existing chat route remains untouched

module.exports = router;