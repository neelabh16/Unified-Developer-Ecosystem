// =============================================================================
// Squad Model
// =============================================================================
const mongoose = require('mongoose');

const squadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Squad name is required'],
      trim: true,
      minlength: [3, 'Squad name must be at least 3 characters'],
      maxlength: [50, 'Squad name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      required: [true, 'Squad description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    registeredHackathons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hackathon',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Squad', squadSchema);
