// =============================================================================
// Auth Controller
// =============================================================================
const User = require('../models/User');
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

module.exports = {
  register,
  login,
  logout,
  getMe,
  changePassword,
};
