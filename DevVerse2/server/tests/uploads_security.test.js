const request = require('supertest');
const app = require('../src/app');
const uploadController = require('../src/controllers/uploadController');
const { validateEnv } = require('../src/config/envValidator');
const User = require('../src/models/User');

jest.mock('../src/models/User');

describe('Security Hardening & File Upload Tests', () => {
  describe('Environment Variable Validation (validateEnv)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should validate successfully in development mode', () => {
      process.env.NODE_ENV = 'development';
      expect(() => validateEnv()).not.toThrow();
    });

    it('should reject invalid non-numeric PORT values', () => {
      process.env.PORT = 'invalid-port-string';
      expect(() => validateEnv()).toThrow(/not a valid number/);
    });

    it('should enforce strong JWT_SECRET in production mode', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short';
      process.env.MONGODB_URI = 'mongodb+srv://test:test@cluster.mongodb.net/test';
      expect(() => validateEnv()).toThrow(/at least 16 characters/);
    });
  });

  describe('File Upload Controller (uploadController.uploadAvatar)', () => {
    let req, res, next;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        user: { _id: '507f191e810c19729de860ea' },
        file: null,
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();
    });

    it('should return 400 if no file was uploaded', async () => {
      await uploadController.uploadAvatar(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, message: 'No image file provided.' })
      );
    });

    it('should save file path, update user avatar, and return 201', async () => {
      req.file = {
        filename: 'abc123456789.png',
        mimetype: 'image/png',
        size: 102400,
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: req.user._id });

      await uploadController.uploadAvatar(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        req.user._id,
        { avatarSeed: '/uploads/abc123456789.png' }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            url: '/uploads/abc123456789.png',
          }),
        })
      );
    });
  });

  describe('Security & Parameter Validation Middleware', () => {
    it('should reject unauthorized upload request with 401', async () => {
      const res = await request(app).post('/api/v1/uploads/avatar');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject malicious parameter injection with forbidden characters', async () => {
      const res = await request(app).get('/api/v1/projects/%24gt%3A1');
      expect([400, 404]).toContain(res.status);
    });
  });
});
