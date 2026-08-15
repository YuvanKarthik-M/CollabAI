const Team = require('../models/Team');

// Create a new team
const createTeam = async (req, res) => {
  try {
    const { name, description, eventName, requiredSkills, requiredInterests } = req.body;

    const team = await Team.create({
      name,
      description,
      eventName: eventName || 'General Project',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      requiredInterests: Array.isArray(requiredInterests) ? requiredInterests : requiredInterests.split(',').map(i => i.trim()).filter(Boolean),
      creator: req.user._id,
      members: [req.user._id],
      isOpen: true
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get teams separated into My Teams and Discover Teams
const getTeams = async (req, res) => {
  try {
    const allTeams = await Team.find({})
      .populate('creator', 'name email skills interests')
      .populate('members', 'name email skills interests')
      .populate('requests', 'name email skills interests');

    const myTeams = [];
    const discoverTeams = [];

    allTeams.forEach(team => {
      const isMember = team.members.some(m => m._id.toString() === req.user._id.toString());
      
      if (isMember) {
        myTeams.push(team);
      } else if (team.isOpen) {
        // Only show to others if invitations are active
        discoverTeams.push(team);
      }
    });

    res.json({ myTeams, discoverTeams });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Team & Toggle Active Status (Leader Only)
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    
    if (team.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can edit team' });
    }

    const { name, description, eventName, requiredSkills, requiredInterests, isOpen } = req.body;

    if (name) team.name = name;
    if (description) team.description = description;
    if (eventName) team.eventName = eventName;
    if (isOpen !== undefined) team.isOpen = isOpen;
    if (requiredSkills) {
      team.requiredSkills = Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (requiredInterests) {
      team.requiredInterests = Array.isArray(requiredInterests) ? requiredInterests : requiredInterests.split(',').map(i => i.trim()).filter(Boolean);
    }

    const updated = await team.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send join request
const joinTeamRequest = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team || !team.isOpen) {
      return res.status(400).json({ message: 'Team is closed or not found' });
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

// Handle Request Action (Accept/Reject)
const handleRequestAction = async (req, res) => {
  try {
    const { teamId, applicantId, action } = req.body;
    const team = await Team.findById(teamId);

    if (!team || team.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    team.requests = team.requests.filter(id => id.toString() !== applicantId.toString());

    if (action === 'accept') {
      if (!team.members.includes(applicantId)) {
        team.members.push(applicantId);
      }
    }

    await team.save();
    res.json({ message: `Request ${action}ed successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createTeam, getTeams, updateTeam, joinTeamRequest, handleRequestAction };