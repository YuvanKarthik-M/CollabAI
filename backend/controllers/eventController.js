const Event = require('../models/Event');
const Team = require('../models/Team');

// @desc    Create a new event (Organisation only)
// @route   POST /api/events
// @access  Private/Organisation
const createEvent = async (req, res) => {
  try {
    const { title, description, category, eventDate, venue, mode, type, maxTeamSize, eligibility } = req.body;

    if (!title || !description || !eventDate || !venue) {
      return res.status(400).json({ message: 'Title, description, date, and venue are required.' });
    }

    const event = await Event.create({
      title,
      description,
      category: category || 'Hackathon',
      eventDate,
      venue,
      mode: mode || 'online',
      type: type || 'team',
      maxTeamSize: type === 'team' ? (maxTeamSize || 4) : 1,
      eligibility: eligibility || 'Open for all students',
      organisation: req.user._id
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get events created by logged-in organisation with registered teams
// @route   GET /api/events/my
// @access  Private/Organisation
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organisation: req.user._id })
      .populate({
        path: 'registeredTeams',
        populate: [
          { path: 'creator', select: 'name email' },
          { path: 'members', select: 'name email' }
        ]
      })
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all active published events with host details and registered teams
// @route   GET /api/events
// @access  Private
const getActiveEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'active' })
      .populate('organisation', 'name email')
      .populate({
        path: 'registeredTeams',
        select: 'name members creator'
      })
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Register a team for an event (Leader only)
// @route   POST /api/events/:id/register-team
// @access  Private
const registerTeamForEvent = async (req, res) => {
  try {
    const { teamId } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status === 'suspended') {
      return res.status(400).json({ message: 'This event is currently suspended by admin' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Authorization check: Must be team leader (creator)
    if (team.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can register the team for events' });
    }

    // Constraint: Max team size check
    if (event.type === 'team' && team.members.length > event.maxTeamSize) {
      return res.status(400).json({ 
        message: `Team size (${team.members.length}) exceeds maximum team size allowed for this event (${event.maxTeamSize})` 
      });
    }

    // Check if team is already registered for this event
    if (event.registeredTeams.some(id => id.toString() === team._id.toString())) {
      return res.status(400).json({ message: 'Team is already registered for this event' });
    }

    // Register team
    event.registeredTeams.push(team._id);
    await event.save();

    team.registeredEvent = event._id;
    team.eventName = event.title;
    await team.save();

    res.json({ message: `Team '${team.name}' registered for event '${event.title}' successfully!`, event, team });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Unregister a team from an event (Leader only)
// @route   POST /api/events/:id/unregister-team
// @access  Private
const unregisterTeamFromEvent = async (req, res) => {
  try {
    const { teamId } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can unregister the team' });
    }

    event.registeredTeams = event.registeredTeams.filter(id => id.toString() !== team._id.toString());
    await event.save();

    if (team.registeredEvent && team.registeredEvent.toString() === event._id.toString()) {
      team.registeredEvent = null;
      team.eventName = 'General Project';
      await team.save();
    }

    res.json({ message: `Team '${team.name}' unregistered from event successfully!`, event, team });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update an event (Organisation only)
// @route   PUT /api/events/:id
// @access  Private/Organisation
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organisation.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this event' });
    }

    const { title, description, category, eventDate, venue, mode, type, maxTeamSize, eligibility } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (category) event.category = category;
    if (eventDate) event.eventDate = eventDate;
    if (venue) event.venue = venue;
    if (mode) event.mode = mode;
    if (type) event.type = type;
    if (maxTeamSize !== undefined) event.maxTeamSize = maxTeamSize;
    if (eligibility) event.eligibility = eligibility;

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an event (Organisation only)
// @route   DELETE /api/events/:id
// @access  Private/Organisation
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organisation.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    // Clean up team references to this event
    await Team.updateMany(
      { registeredEvent: event._id },
      { $set: { registeredEvent: null, eventName: 'General Project' } }
    );

    await Event.findByIdAndDelete(event._id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createEvent,
  getMyEvents,
  getActiveEvents,
  registerTeamForEvent,
  unregisterTeamFromEvent,
  updateEvent,
  deleteEvent
};
