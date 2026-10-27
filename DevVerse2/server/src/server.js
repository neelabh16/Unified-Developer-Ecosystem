// =============================================================================
// HTTP Server & Lifecycle Management
// =============================================================================
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const { connectDB } = require('./config/database');
const { validateEnv } = require('./config/envValidator');

const PORT = process.env.PORT || 5000;

let server;

/**
 * Start the application:
 * 1. Validate environment configuration
 * 2. Connect to MongoDB Atlas (fails hard if DB cannot be reached)
 * 3. Start HTTP listener
 */
const startServer = async () => {
  validateEnv();
  // Connect database first
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`==============================================`);
    console.log(`🚀 DevVerse API Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`==============================================`);
  });
};

/**
 * Graceful shutdown handler.
 * Closes active connections and exits cleanly.
 */
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('🔒 HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force exit after 10s if connections fail to close
  setTimeout(() => {
    console.error('⚠️ Forcefully terminating remaining connections.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Start if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
