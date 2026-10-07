const User = require('../models/User');
const Team = require('../models/Team');
const Message = require('../models/Message');
const Event = require('../models/Event');

// @desc    Get admin analytics (total teams, total organisations, total events)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments();
    const totalOrganisations = await User.countDocuments({ role: 'organisation' });
    const totalEvents = await Event.countDocuments();

    res.json({
      totalTeams,
      totalOrganisations,
      totalEvents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all teams for admin overview
// @route   GET /api/admin/teams
// @access  Private/Admin
const getAllTeams = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { eventName: { $regex: search, $options: 'i' } }
      ];
    }

    const teams = await Team.find(filter)
      .populate('creator', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a team (Remove team)
// @route   DELETE /api/admin/teams/:id
// @access  Private/Admin
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    await Message.deleteMany({ team: team._id });
    await Team.findByIdAndDelete(team._id);

    res.json({ message: 'Team removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all registered organisations
// @route   GET /api/admin/organisations
// @access  Private/Admin
const getAllOrganisations = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { role: 'organisation' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const organisations = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(organisations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an organisation account
// @route   DELETE /api/admin/organisations/:id
// @access  Private/Admin
const deleteOrganisation = async (req, res) => {
  try {
    const org = await User.findById(req.params.id);
    if (!org || org.role !== 'organisation') {
      return res.status(404).json({ message: 'Organisation not found' });
    }

    // Clean up events hosted by this organisation
    await Event.deleteMany({ organisation: org._id });
    await User.findByIdAndDelete(org._id);

    res.json({ message: 'Organisation account and associated events removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all events
// @route   GET /api/admin/events
// @access  Private/Admin
const getAllEvents = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(filter)
      .populate('organisation', 'name email')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Suspend or unsuspend an event
// @route   PUT /api/admin/events/:id/suspend
// @access  Private/Admin
const toggleSuspendEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.status = event.status === 'suspended' ? 'active' : 'suspended';
    await event.save();

    res.json({
      message: `Event status updated to ${event.status}`,
      event
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/admin/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await Event.findByIdAndDelete(event._id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAllTeams,
  deleteTeam,
  getAllOrganisations,
  deleteOrganisation,
  getAllEvents,
  toggleSuspendEvent,
  deleteEvent
};
