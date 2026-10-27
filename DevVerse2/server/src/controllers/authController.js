// =============================================================================
// Auth Controller
// =============================================================================
const User = require('../models/User');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/token');

/**
 * Register a new user account.
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return next(new AppError('Please provide name, username, email, and password.', 400));
    }

    // Password strength check
    if (password.length < 7) {
      return next(new AppError('Password must be at least 7 characters long.', 400));
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/`~\\]/.test(password);
    if (!hasUpper || !hasNumber || !hasSpecial) {
      return next(
        new AppError(
          'Password must include at least one uppercase letter, one number, and one special character.',
          400
        )
      );
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    // Check duplicate username
    const existingUsername = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUsername) {
      return next(new AppError('That username is already taken.', 409));
    }

    // Public registration always assigns 'user' role
    const newUser = await User.create({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      role: 'user',
      points: 20, // 20 milestone points for account creation
    });

    await Activity.create({
      user: newUser._id,
      amount: 20,
      reason: 'Welcome bonus — Account created',
      bucket: 'register',
      entityId: newUser._id.toString(),
    });

    const token = signToken(newUser._id, newUser.role);
    setAuthCookie(res, token);

    return sendSuccess(res, 201, 'Registration successful', {
      user: newUser,
      token, // Also return in body for mobile / API clients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user.
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const token = signToken(user._id, user.role);
    setAuthCookie(res, token);

    return sendSuccess(res, 200, 'Login successful', {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out the current user.
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    return sendSuccess(res, 200, 'Successfully logged out');
  } catch (error) {
    next(error);
  }
};

/**
 * Get the currently authenticated user's profile.
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    return sendSuccess(res, 200, 'Current user retrieved', {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change the current user's password.
 * PUT /api/v1/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current password and new password.', 400));
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password does not match.', 401));
    }

    if (newPassword.length < 7) {
      return next(new AppError('New password must be at least 7 characters long.', 400));
    }

    user.password = newPassword;
    await user.save();

    const token = signToken(user._id, user.role);
    setAuthCookie(res, token);

    return sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * External OAuth login & signup for Google and GitHub.
 * POST /api/v1/auth/oauth
 */
const oauthLogin = async (req, res, next) => {
  try {
    const { provider, email, name, username, providerId, github } = req.body;

    if (!provider || !['google', 'github'].includes(provider)) {
      return next(new AppError('Provider must be either "google" or "github".', 400));
    }

    if (!email) {
      return next(new AppError('Email address is required for external authentication.', 400));
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Find or generate a clean unique username
      let candidateUsername = (username || cleanEmail.split('@')[0] || (provider + '_' + Date.now()))
        .toLowerCase()
        .replace(/[^a-zA-Z0-9_.-]/g, '');
      if (candidateUsername.length < 3) candidateUsername += '_user';
      if (candidateUsername.length > 24) candidateUsername = candidateUsername.slice(0, 24);

      let existing = await User.findOne({ username: candidateUsername });
      let counter = 1;
      while (existing) {
        const suffix = `${counter}`;
        candidateUsername = `${candidateUsername.slice(0, 20)}${suffix}`;
        existing = await User.findOne({ username: candidateUsername });
        counter++;
      }

      user = await User.create({
        name: (name && name.trim()) || candidateUsername,
        username: candidateUsername,
        email: cleanEmail,
        provider,
        providerId: providerId || `${provider}_${Date.now()}`,
        avatarSeed: candidateUsername,
        github: provider === 'github' ? (github || username || candidateUsername) : (github || ''),
        role: 'user',
        points: 20, // Welcome milestone bonus
      });

      await Activity.create({
        user: user._id,
        amount: 20,
        reason: 'Welcome bonus — Account created',
        bucket: 'register',
        entityId: user._id.toString(),
      });
    } else {
      // If user signed in with GitHub and hasn't linked github handle yet, link it
      if (provider === 'github' && !user.github) {
        user.github = github || username || user.username;
        await user.save();
      }
    }

    const token = signToken(user._id, user.role);
    setAuthCookie(res, token);

    return sendSuccess(res, 200, `${provider === 'google' ? 'Google' : 'GitHub'} authentication successful`, {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  changePassword,
  oauthLogin,
};
