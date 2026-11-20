const Team = require('../models/Team');
const Message = require('../models/Message');
const User = require('../models/User');
const { getAdminEmails } = require('../utils/adminCheck');

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
        const teamSkills    = (team.requiredSkills    || []).map(s => s.toLowerCase());
        const teamInterests = (team.requiredInterests || []).map(i => i.toLowerCase());

        const matchedSkills    = teamSkills.filter(s => userSkills.includes(s));
        const matchedInterests = teamInterests.filter(i => userInterests.includes(i));

        const skillScore    = teamSkills.length    > 0 ? matchedSkills.length    / teamSkills.length    : 0;

        const matchPercentage = Math.round(skillScore * 100);

        const teamObj = team.toObject();
        teamObj.matchScore        = matchPercentage;
        teamObj.matchedSkills     = matchedSkills;
        teamObj.matchedInterests  = matchedInterests;
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
    const adminEmails = getAdminEmails();
    const isUserAdmin = req.user.role === 'admin' || adminEmails.includes((req.user.email || '').trim().toLowerCase());
    const isUserOrg = req.user.role === 'organisation';

    if (isUserAdmin || isUserOrg) {
      return res.status(403).json({ message: 'Only students can request to join teams' });
    }

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

// @desc    Search students to invite (excluding current team members, organisations, and admins)
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

    const adminEmails = getAdminEmails();
    const search = (req.query.search || '').trim();

    const andConditions = [
      { _id: { $nin: excludedIds } },
      {
        $or: [
          { role: 'student' },
          { role: { $exists: false } },
          { role: null }
        ]
      },
      {
        role: { $nin: ['admin', 'organisation', 'ADMIN', 'ORGANISATION'] }
      }
    ];

    if (adminEmails && adminEmails.length > 0) {
      andConditions.push({
        email: { $nin: adminEmails.map(email => new RegExp(`^${email}$`, 'i')) }
      });
    }

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { skills: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    const rawCandidates = await User.find({ $and: andConditions })
      .select('name email skills interests role');

    // Compute match score for each candidate against team's required skills & interests
    const teamSkills    = (team.requiredSkills    || []).map(s => s.trim().toLowerCase());
    const teamInterests = (team.requiredInterests || []).map(i => i.trim().toLowerCase());

    const candidates = rawCandidates.map(candidate => {
      const c = candidate.toObject();
      const cSkills    = (c.skills    || []).map(s => s.trim().toLowerCase());
      const cInterests = (c.interests || []).map(i => i.trim().toLowerCase());

      const matchedSkills    = teamSkills.filter(s => cSkills.includes(s));
      const matchedInterests = teamInterests.filter(i => cInterests.includes(i));

      const skillScore    = teamSkills.length    > 0 ? matchedSkills.length    / teamSkills.length    : 0;
      const matchScore    = Math.round(skillScore * 100);

      return {
        ...c,
        matchScore,
        matchedSkills,
        matchedInterests
      };
    });

    // Sort best match first
    candidates.sort((a, b) => b.matchScore - a.matchScore);

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

    // Verify candidate exists and is a student (not organisation or admin)
    const targetUser = await User.findById(studentId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const adminEmails = getAdminEmails();
    const isTargetAdmin = targetUser.role === 'admin' || adminEmails.includes((targetUser.email || '').trim().toLowerCase());
    const isTargetOrg = targetUser.role === 'organisation';

    if (isTargetAdmin || isTargetOrg || (targetUser.role && targetUser.role !== 'student')) {
      return res.status(400).json({ message: 'Invitations can only be sent to students' });
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

// @desc    Leave a team (Member only)
// @route   POST /api/teams/:id/leave
const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Team leader cannot leave the team. You can delete or edit the team instead.' });
    }

    const isMember = team.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this team' });
    }

    team.members = team.members.filter(m => m.toString() !== req.user._id.toString());
    await team.save();

    res.json({ message: 'You have left the team successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove a member from team (Leader only)
// @route   DELETE /api/teams/:id/members/:memberId
const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can remove members' });
    }

    if (team.creator.toString() === memberId.toString()) {
      return res.status(400).json({ message: 'Cannot remove the team leader' });
    }

    const isMember = team.members.some(m => m.toString() === memberId.toString());
    if (!isMember) {
      return res.status(400).json({ message: 'User is not a member of this team' });
    }

    team.members = team.members.filter(m => m.toString() !== memberId.toString());
    await team.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createTeam, getTeams, updateTeam, joinTeamRequest, handleRequestAction, getInviteCandidates, sendTeamInvite, getMyInvitations, handleInvitationAction, getTeamMessages, leaveTeam, removeMember };