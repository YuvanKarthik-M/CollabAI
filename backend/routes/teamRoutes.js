const express = require('express');
const router = express.Router();
const { createTeam, getTeams, updateTeam, joinTeamRequest, handleRequestAction } = require('../controllers/teamController');
const protect = require('../middleware/authMiddleware'); //

router.route('/')
  .get(protect, getTeams)
  .post(protect, createTeam);

router.put('/:id', protect, updateTeam);
router.post('/:id/join', protect, joinTeamRequest);
router.post('/requests/action', protect, handleRequestAction);

module.exports = router;