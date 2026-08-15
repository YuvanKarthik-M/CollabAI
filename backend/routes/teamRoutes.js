const express = require('express');
const router = express.Router();
const { createTeam, getTeams, joinTeamRequest } = require('../controllers/teamController');
const protect = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTeams)
  .post(protect, createTeam);

router.post('/:id/join', protect, joinTeamRequest);

module.exports = router;