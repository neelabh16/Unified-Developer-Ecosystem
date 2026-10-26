// =============================================================================
// Health Check Routes
// =============================================================================
const express = require('express');
const router = express.Router();
const { getDBStatus } = require('../config/database');

/**
 * Health check endpoint exposing API status and database readiness.
 * GET /api/v1/health
 */
router.get('/health', (req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus === 'connected';

  const payload = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      ready: isHealthy,
    },
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // If database connection is not ready, return 503 Service Unavailable
  const statusCode = isHealthy ? 200 : 503;
  return res.status(statusCode).json(payload);
});

module.exports = router;
