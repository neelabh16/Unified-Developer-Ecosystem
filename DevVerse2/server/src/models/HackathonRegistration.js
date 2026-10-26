// =============================================================================
// HackathonRegistration Model
// =============================================================================
const mongoose = require('mongoose');

const hackathonRegistrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
      index: true,
    },
    squad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Squad',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate registrations for the same user and hackathon
hackathonRegistrationSchema.index({ user: 1, hackathon: 1 }, { unique: true });

module.exports = mongoose.model('HackathonRegistration', hackathonRegistrationSchema);
