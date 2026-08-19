const Team = require('../models/Team');
const Message = require('../models/Message');
const User = require('../models/User');

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
    const user = await User.findById(req.user._id);
    const allTeams = await Team.find({})
      .populate('creator', 'name email skills interests')
      .populate('members', 'name email skills interests')
      .populate('requests', 'name email skills interests')
      .populate('invitations', 'name email skills interests'); // <-- Populates invited student details

    const userSkills = (user.skills || []).map(s => s.toLowerCase());
    const userInterests = (user.interests || []).map(i => i.toLowerCase());

    const myTeams = [];
    const discoverTeams = [];

    allTeams.forEach(team => {
      const isMember = team.members.some(m => m._id.toString() === req.user._id.toString());
      
      if (isMember) {
        myTeams.push(team);
      } else if (team.isOpen) {
        const teamSkills = (team.requiredSkills || []).map(s => s.toLowerCase());
        const teamInterests = (team.requiredInterests || []).map(i => i.toLowerCase());

        const matchingSkills = teamSkills.filter(s => userSkills.includes(s)).length;
        const skillScore = teamSkills.length > 0 ? (matchingSkills / teamSkills.length) : 0;

        const matchingInterests = teamInterests.filter(i => userInterests.includes(i)).length;
        const interestScore = teamInterests.length > 0 ? (matchingInterests / teamInterests.length) : 0;

        const matchPercentage = Math.round(((skillScore * 0.6) + (interestScore * 0.4)) * 100);

        const teamObj = team.toObject();
        teamObj.matchScore = matchPercentage;
        discoverTeams.push(teamObj);
      }
    });

    discoverTeams.sort((a, b) => b.matchScore - a.matchScore);

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
    if (eventName !== undefined) team.eventName = eventName;
    if (isOpen !== undefined) team.isOpen = isOpen;

    // Convert comma-separated string or preserve array
    if (requiredSkills !== undefined) {
      team.requiredSkills = Array.isArray(requiredSkills)
        ? requiredSkills
        : requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (requiredInterests !== undefined) {
      team.requiredInterests = Array.isArray(requiredInterests)
        ? requiredInterests
        : requiredInterests.split(',').map(i => i.trim()).filter(Boolean);
    }

    await team.save();

    // Repopulate user details before returning
    const updatedTeam = await Team.findById(team._id)
      .populate('creator', 'name email skills interests')
      .populate('members', 'name email skills interests')
      .populate('requests', 'name email skills interests')
      .populate('invitations', 'name email skills interests');

    res.json(updatedTeam);
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

// @desc    Search students to invite (excluding current team members)
// @route   GET /api/teams/:id/candidates
const getInviteCandidates = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Exclude existing members, already invited students, and applicants
    const excludedIds = [
      ...team.members,
      ...(team.invitations || []),
      ...(team.requests || [])
    ];

    const search = req.query.search || '';
    const candidates = await User.find({
      _id: { $nin: excludedIds },
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ]
    }).select('name email skills interests');

    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send an invitation to a student (Leader only)
// @route   POST /api/teams/:id/invite
const sendTeamInvite = async (req, res) => {
  try {
    const { studentId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can send invitations' });
    }

    if (team.members.includes(studentId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    if (team.invitations.includes(studentId)) {
      return res.status(400).json({ message: 'Invitation already sent to this user' });
    }

    team.invitations.push(studentId);
    await team.save();

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all invitations received by the logged-in user
// @route   GET /api/teams/invitations/me
const getMyInvitations = async (req, res) => {
  try {
    const invitations = await Team.find({ invitations: req.user._id })
      .populate('creator', 'name email')
      .populate('members', 'name email');

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Accept or reject a team invitation
// @route   POST /api/teams/invitations/action
const handleInvitationAction = async (req, res) => {
  try {
    const { teamId, action } = req.body; // action: 'accept' | 'reject'
    const team = await Team.findById(teamId);

    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (!team.invitations.includes(req.user._id)) {
      return res.status(400).json({ message: 'No invitation found for this user' });
    }

    // Remove from invitations list
    team.invitations = team.invitations.filter(id => id.toString() !== req.user._id.toString());

    if (action === 'accept') {
      if (!team.members.includes(req.user._id)) {
        team.members.push(req.user._id); // Adding user here automatically activates their chat access
      }
    }

    await team.save();
    res.json({ message: `Invitation ${action}ed successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch team message history (members only)
const getTeamMessages = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Authorization check
    const isMember = team.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Only team members can view chat history' });
    }

    const messages = await Message.find({ team: req.params.id })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error loading messages', error: error.message });
  }
};

module.exports = { createTeam, getTeams, updateTeam, joinTeamRequest, handleRequestAction, getInviteCandidates, sendTeamInvite, getMyInvitations, handleInvitationAction, getTeamMessages };