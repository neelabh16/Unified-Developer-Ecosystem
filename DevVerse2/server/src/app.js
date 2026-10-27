// =============================================================================
// Express Application Configuration
// =============================================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const communityRoutes = require('./routes/communityRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const codexRoutes = require('./routes/codexRoutes');
const hackathonRoutes = require('./routes/hackathonRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const squadRoutes = require('./routes/squadRoutes');
const messageRoutes = require('./routes/messageRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const activityRoutes = require('./routes/activityRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Allowed CORS origins
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://localhost:8080',
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin'],
  })
);

// Request parsing & size limits (1MB max payload to mitigate DOS attacks)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Sanitize inputs to prevent NoSQL query injection
app.use(mongoSanitize());

// Rate Limiting (active in development and production, bypassed in test mode)
if (process.env.NODE_ENV !== 'test') {
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP, please try again in 15 minutes.' }
  });
  app.use('/api/', generalLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts, please try again in 15 minutes.' }
  });
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
}

// Serve uploaded assets safely with traversal protection
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath, { dotfiles: 'ignore', index: false }));

// API v1 Routes
const API_PREFIX = '/api/v1';

app.use(API_PREFIX, healthRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/communities`, communityRoutes);
app.use(`${API_PREFIX}/discussions`, discussionRoutes);
app.use(`${API_PREFIX}/codex`, codexRoutes);
app.use(`${API_PREFIX}/hackathons`, hackathonRoutes);
app.use(`${API_PREFIX}/portfolios`, portfolioRoutes);
app.use(`${API_PREFIX}/squads`, squadRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);
app.use(`${API_PREFIX}/bookmarks`, bookmarkRoutes);
app.use(`${API_PREFIX}/activity`, activityRoutes);
app.use(`${API_PREFIX}/leaderboard`, leaderboardRoutes);
app.use(`${API_PREFIX}/uploads`, uploadRoutes);

// Serve static client frontend files from DevVerse2
const clientPath = path.resolve(__dirname, '../../');
app.use(express.static(clientPath));

// Centralized 404 handler for unmatched routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server.`, 404));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
