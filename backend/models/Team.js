const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  eventName: { type: String, default: 'General Project' },
  registeredEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  requiredSkills: [String],
  requiredInterests: [String],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Student -> Leader
  invitations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Leader -> Student
  isOpen: { type: Boolean, default: true }
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;