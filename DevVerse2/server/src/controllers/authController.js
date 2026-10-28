// =============================================================================
// Auth Controller
// =============================================================================
const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Portfolio = require('../models/Portfolio');
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

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await Activity.create({
        user: newUser._id,
        amount: 20,
        reason: 'Welcome bonus — Account created',
        bucket: 'register',
        entityId: newUser._id.toString(),
      }).catch(() => {});
    }

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
    res.clearCookie('dv_jwt', { path: '/' });
    res.clearCookie('dv_current_user_id', { path: '/' });
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
        avatarUrl: avatarUrl || '',
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
      let updated = false;
      if (provider === 'github' && !user.github) {
        user.github = github || username || user.username;
        updated = true;
      }
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        updated = true;
      }
      if (updated) await user.save();
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

/**
 * Helper to get client origin & base subpath from request headers or environment
 */
const getClientOrigin = (req) => {
  if (req && req.query && req.query.client_base) {
    return req.query.client_base.replace(/\/+$/, '');
  }
  const referer = req.get('referer');
  if (referer) {
    try {
      const parsed = new URL(referer);
      const pathParts = parsed.pathname.split('/');
      pathParts.pop(); // remove login.html, signup.html etc.
      const subpath = pathParts.join('/');
      return `${parsed.origin}${subpath}`.replace(/\/+$/, '');
    } catch (e) {}
  }
  return (process.env.CLIENT_ORIGIN || 'http://localhost:5500').replace(/\/+$/, '');
};

/**
 * Shared helper for creating or linking OAuth user records
 */
const findOrCreateOAuthUser = async ({ provider, providerId, email, name, username, avatarUrl, github, bio }) => {
  const cleanEmail = (email || '').trim().toLowerCase();

  let user = null;
  if (providerId) {
    user = await User.findOne({ provider, providerId });
  }
  if (!user && cleanEmail) {
    user = await User.findOne({ email: cleanEmail });
  }

  if (user) {
    let changed = false;
    if (!user.providerId && providerId) {
      user.providerId = providerId;
      changed = true;
    }
    if (avatarUrl && (!user.avatarUrl || user.avatarUrl.includes('dicebear'))) {
      user.avatarUrl = avatarUrl;
      user.avatarSeed = avatarUrl;
      changed = true;
    }
    if (github && !user.github) {
      user.github = github;
      changed = true;
    }
    // Ensure bio fits schema if pre-existing legacy bio exceeded bounds
    if (user.bio && user.bio.length > 1000) {
      user.bio = user.bio.slice(0, 1000);
      changed = true;
    }
    if (changed) {
      await user.save();
    }
    return user;
  }

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

  const safeBio = (bio || '').slice(0, 1000);
  const safeName = ((name && name.trim()) || candidateUsername).slice(0, 60);

  user = await User.create({
    name: safeName,
    username: candidateUsername,
    email: cleanEmail,
    provider,
    providerId: providerId || `${provider}_${Date.now()}`,
    avatarSeed: avatarUrl || candidateUsername,
    avatarUrl: avatarUrl || '',
    github: github || (provider === 'github' ? candidateUsername : ''),
    bio: safeBio,
    role: 'user',
    points: 20,
  });

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    await Activity.create({
      user: user._id,
      amount: 20,
      reason: 'Welcome bonus — Account created',
      bucket: 'register',
      entityId: user._id.toString(),
    }).catch(() => {});

    await Portfolio.create({
      user: user._id,
      handle: user.username,
      name: user.name,
      title: 'Full-stack Developer',
      bio: user.bio || '',
      avatarSeed: user.avatarUrl || user.avatarSeed || user.username,
      accent: '#7c6fff',
      skills: user.skills || [],
      links: github ? [{ label: 'GitHub', url: `https://github.com/${github}` }] : [],
      projects: [],
    }).catch(() => {});
  }

  return user;
};

/**
 * Returns OAuth providers status (whether credentials are configured in .env)
 * GET /api/v1/auth/providers
 */
const getOAuthProviders = (req, res) => {
  return sendSuccess(res, 200, 'OAuth providers status', {
    github: {
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      configured: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
    google: {
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  });
};

/**
 * Real GitHub OAuth 2.0 Authorization Endpoint
 * GET /api/v1/auth/github
 */
const githubOAuth = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectTarget = req.query.redirect || 'index.html';
  const clientOrigin = getClientOrigin(req);

  if (!clientId || !clientSecret) {
    return res.redirect(`${clientOrigin}/login.html?oauth_error=github_credentials_missing&provider=github&redirect=${encodeURIComponent(redirectTarget)}`);
  }

  const backendHost = req.get('host');
  const protocol = req.protocol;
  const callbackUrl = `${protocol}://${backendHost}/api/v1/auth/github/callback`;
  const state = Buffer.from(JSON.stringify({ redirect: redirectTarget, origin: clientOrigin, ts: Date.now() })).toString('base64');

  res.cookie('dv_oauth_state', state, { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=read:user%20user:email&state=${encodeURIComponent(state)}`;
  return res.redirect(githubAuthUrl);
};

/**
 * Real GitHub OAuth 2.0 Callback Endpoint
 * GET /api/v1/auth/github/callback
 */
const githubOAuthCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    let parsedState = {};
    try {
      if (state) {
        parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      }
    } catch (e) {}

    const clientOrigin = (parsedState.origin || getClientOrigin(req)).replace(/\/+$/, '');
    const redirectPath = (parsedState.redirect || 'index.html').replace(/^\/+/, '');

    if (error) {
      return res.redirect(`${clientOrigin}/login.html?oauth_error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code) {
      return res.redirect(`${clientOrigin}/login.html?oauth_error=missing_auth_code`);
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.redirect(`${clientOrigin}/login.html?oauth_error=github_credentials_missing&provider=github`);
    }

    const backendHost = req.get('host');
    const protocol = req.protocol;
    const callbackUrl = `${protocol}://${backendHost}/api/v1/auth/github/callback`;

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData || !tokenData.access_token) {
      const errReason = (tokenData && (tokenData.error_description || tokenData.error)) || 'Failed to exchange GitHub authorization code';
      return res.redirect(`${clientOrigin}/login.html?oauth_error=${encodeURIComponent(errReason)}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from GitHub API
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'DevVerse-OAuth-App',
        Accept: 'application/json',
      },
    });

    const ghUser = await userRes.json();
    if (!ghUser || !ghUser.id) {
      return res.redirect(`${clientOrigin}/login.html?oauth_error=Failed to retrieve GitHub profile`);
    }

    // 3. Fetch primary verified email if private
    let email = ghUser.email;
    if (!email) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'DevVerse-OAuth-App',
            Accept: 'application/json',
          },
        });
        const emails = await emailsRes.json();
        if (Array.isArray(emails)) {
          const primaryVerified = emails.find((e) => e.primary && e.verified);
          const verified = emails.find((e) => e.verified);
          email = (primaryVerified && primaryVerified.email) || (verified && verified.email) || (emails[0] && emails[0].email);
        }
      } catch (e) {}
    }

    if (!email) {
      email = `${ghUser.login}@users.noreply.github.com`;
    }

    // 4. Find or create user
    const user = await findOrCreateOAuthUser({
      provider: 'github',
      providerId: `github_${ghUser.id}`,
      email: email,
      name: ghUser.name || ghUser.login,
      username: ghUser.login,
      avatarUrl: ghUser.avatar_url || '',
      github: ghUser.login,
      bio: ghUser.bio || '',
    });

    // 5. Issue session cookie and token
    const token = signToken(user._id, user.role);
    setAuthCookie(res, token);
    res.cookie('dv_jwt', token, { path: '/', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.cookie('dv_current_user_id', user._id.toString(), { path: '/', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.clearCookie('dv_oauth_state');

    const cleanRedirect = redirectPath.includes('?') 
      ? `${redirectPath}&oauth=success&provider=github&token=${encodeURIComponent(token)}` 
      : `${redirectPath}?oauth=success&provider=github&token=${encodeURIComponent(token)}`;
    return res.redirect(`${clientOrigin}/${cleanRedirect}`);
  } catch (err) {
    console.error('GitHub OAuth callback error:', err);
    let clientOrigin = getClientOrigin(req);
    try {
      if (req.query.state) {
        const s = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf8'));
        if (s.origin) clientOrigin = s.origin.replace(/\/+$/, '');
      }
    } catch (e) {}
    return res.redirect(`${clientOrigin}/login.html?oauth_error=${encodeURIComponent(err.message || 'OAuth error')}`);
  }
};

/**
 * Real Google OAuth 2.0 Authorization Endpoint
 * GET /api/v1/auth/google
 */
const googleOAuth = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectTarget = req.query.redirect || 'index.html';
  const clientOrigin = getClientOrigin(req);

  if (!clientId || !clientSecret) {
    return res.redirect(`${clientOrigin}/login.html?oauth_error=google_credentials_missing&provider=google&redirect=${encodeURIComponent(redirectTarget)}`);
  }

  const backendHost = req.get('host');
  const protocol = req.protocol;
  const callbackUrl = `${protocol}://${backendHost}/api/v1/auth/google/callback`;
  const state = Buffer.from(JSON.stringify({ redirect: redirectTarget, origin: clientOrigin, ts: Date.now() })).toString('base64');

  res.cookie('dv_oauth_state', state, { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=openid%20profile%20email&prompt=select_account&state=${encodeURIComponent(state)}`;
  return res.redirect(googleAuthUrl);
};

/**
 * Real Google OAuth 2.0 Callback Endpoint
 * GET /api/v1/auth/google/callback
 */
const googleOAuthCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    let parsedState = {};
    try {
      if (state) {
        parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      }
    } catch (e) {}

    const clientOrigin = (parsedState.origin || getClientOrigin(req)).replace(/\/+$/, '');
    const redirectPath = (parsedState.redirect || 'index.html').replace(/^\/+/, '');

    if (error) {
      return res.redirect(`${clientOrigin}/login.html?oauth_error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code) {
      return res.redirect(`${clientOrigin}/login.html?oauth_error=missing_auth_code`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.redirect(`${clientOrigin}/login.html?oauth_error=google_credentials_missing&provider=google`);
    }

    const backendHost = req.get('host');
    const protocol = req.protocol;
    const callbackUrl = `${protocol}://${backendHost}/api/v1/auth/google/callback`;

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData || !tokenData.access_token) {
      const errReason = (tokenData && (tokenData.error_description || tokenData.error)) || 'Failed to exchange Google authorization code';
      return res.redirect(`${clientOrigin}/login.html?oauth_error=${encodeURIComponent(errReason)}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from Google UserInfo API
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    const gUser = await userRes.json();
    if (!gUser || !gUser.email) {
      return res.redirect(`${clientOrigin}/login.html?oauth_error=Failed to retrieve Google profile`);
    }

    // 3. Find or create user
    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: `google_${gUser.sub}`,
      email: gUser.email,
      name: gUser.name || gUser.given_name || 'Google User',
      username: gUser.email.split('@')[0],
      avatarUrl: gUser.picture || '',
      bio: '',
    });

    // 4. Issue session cookie and token
    const token = signToken(user._id, user.role);
    setAuthCookie(res, token);
    res.cookie('dv_jwt', token, { path: '/', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.clearCookie('dv_oauth_state');

    const cleanRedirect = redirectPath.includes('?') 
      ? `${redirectPath}&oauth=success&provider=google&token=${encodeURIComponent(token)}` 
      : `${redirectPath}?oauth=success&provider=google&token=${encodeURIComponent(token)}`;
    return res.redirect(`${clientOrigin}/${cleanRedirect}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    let clientOrigin = getClientOrigin(req);
    try {
      if (req.query.state) {
        const s = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf8'));
        if (s.origin) clientOrigin = s.origin.replace(/\/+$/, '');
      }
    } catch (e) {}
    return res.redirect(`${clientOrigin}/login.html?oauth_error=${encodeURIComponent(err.message || 'OAuth error')}`);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  changePassword,
  oauthLogin,
  getOAuthProviders,
  githubOAuth,
  githubOAuthCallback,
  googleOAuth,
  googleOAuthCallback,
};
