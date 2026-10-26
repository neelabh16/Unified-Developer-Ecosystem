// =============================================================================
// Health Check & 404 Tests
// =============================================================================
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/v1/health', () => {
  it('should return 503 Service Unavailable when database is disconnected', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('status', 'unhealthy');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('ready', false);
    expect(res.body).toHaveProperty('uptime');
  });

  it('should return 404 for non-existent route with standardized JSON error', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toMatch(/Cannot find endpoint/);
  });
});
