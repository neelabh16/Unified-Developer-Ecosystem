// =============================================================================
// User Model
// =============================================================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    username: {
      type: String,
      required: [true, 'Please choose a username'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [24, 'Username cannot exceed 24 characters'],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, hyphens, and underscores',
      ],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [7, 'Password must be at least 7 characters long'],
      select: false, // Do not return password by default in queries
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
    avatarSeed: {
      type: String,
      trim: true,
      default: 'you-builder',
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    usernameChangeUsed: {
      type: Boolean,
      default: false,
    },
    settings: {
      theme: {
        type: String,
        enum: ['dark', 'light'],
        default: 'dark',
      },
      accent: {
        type: String,
        enum: ['violet', 'cyan', 'coral', 'amber', 'legend'],
        default: 'violet',
      },
      motion: {
        type: String,
        enum: ['on', 'off'],
        default: 'on',
      },
    },
    squadFinderProfile: {
      skills: { type: [String], default: [] },
      categories: { type: [String], default: [] },
      style: {
        type: String,
        enum: ['similar', 'complement', 'either'],
        default: 'either',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ points: -1 });

// Password hashing hook before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to check password validity
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
