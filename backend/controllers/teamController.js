const Team = require('../models/Team');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const { name, description, requiredSkills, requiredInterests } = req.body;

    const team = await Team.create({
      name,
      description,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      requiredInterests: Array.isArray(requiredInterests) ? requiredInterests : requiredInterests.split(',').map(i => i.trim()).filter(Boolean),
      creator: req.user._id,
      members: [req.user._id] // Creator is automatically the first member
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all teams for discovery/recommendations
// @route   GET /api/teams
// @access  Private
const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({}).populate('creator', 'name email').populate('members', 'name email');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Request to join a team
// @route   POST /api/teams/:id/join
// @access  Private
const joinTeamRequest = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.members.includes(req.user._id) || team.requests.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member or request already sent' });
    }

    team.requests.push(req.user._id);
    await team.save();

    res.json({ message: 'Join request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createTeam, getTeams, joinTeamRequest };