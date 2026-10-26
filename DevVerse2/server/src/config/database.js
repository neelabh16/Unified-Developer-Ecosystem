// =============================================================================
// Database Configuration — MongoDB Atlas via Mongoose
// =============================================================================
const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas.
 * Fails hard if the connection string is missing or connection fails —
 * the app must NOT start without a working database.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    console.error('   Copy .env.example to .env and set your Atlas connection string.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error('   Check your MONGODB_URI, network access whitelist, and database user credentials.');
    process.exit(1);
  }
};

/**
 * Returns the current Mongoose connection readiness state.
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = { connectDB, getDBStatus };
