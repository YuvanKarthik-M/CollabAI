const Event = require('../models/Event');

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

// @desc    Get events created by logged-in organisation
// @route   GET /api/events/my
// @access  Private/Organisation
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organisation: req.user._id }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all active published events (For students to select during team creation)
// @route   GET /api/events
// @access  Private
const getActiveEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'active' })
      .populate('organisation', 'name email')
      .sort({ createdAt: -1 });
    res.json(events);
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
  updateEvent,
  deleteEvent
};
