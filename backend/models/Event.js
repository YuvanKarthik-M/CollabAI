const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, default: 'Hackathon' },
  eventDate: { type: String, required: true }, // e.g. "2026-11-15" or ISO string
  venue: { type: String, required: true }, // e.g. "Main Auditorium" or "Zoom / Google Meet"
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
  type: { type: String, enum: ['individual', 'team'], default: 'team' },
  maxTeamSize: { type: Number, default: 4 },
  eligibility: { type: String, default: 'Open for all students' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  registeredTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
