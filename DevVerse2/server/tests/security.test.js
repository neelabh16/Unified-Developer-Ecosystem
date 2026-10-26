// =============================================================================
// Security & Middleware Tests
// =============================================================================
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../src/middleware/auth');
const csrfProtection = require('../src/middleware/csrf');
const User = require('../src/models/User');

describe('Security & Middleware', () => {
  describe('JWT Token & Auth Middleware', () => {
    it('should reject unauthenticated request when token cookie is missing', async () => {
      const req = { cookies: {} };
      const res = {};
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      expect(err.message).toMatch(/Not authenticated/);
    });

    it('should reject request when token is invalid or tampered', async () => {
      const req = { cookies: { token: 'invalid.tampered.token' } };
      const res = {};
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      expect(err.message).toMatch(/Invalid or expired token/);
    });

    it('should reject request when user no longer exists', async () => {
      const token = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'user' }, 'secret');
      process.env.JWT_SECRET = 'secret';

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = { cookies: { token } };
      const res = {};
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      expect(err.message).toMatch(/no longer exists/);

      User.findById.mockRestore();
    });

    it('should attach user to req when token is valid and user exists', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Ada Lovelace',
        username: 'adalovelace',
        role: 'user',
      };
      const token = jwt.sign({ id: mockUser._id, role: mockUser.role }, 'secret');
      process.env.JWT_SECRET = 'secret';

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const req = { cookies: { token } };
      const res = {};
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual(mockUser);

      User.findById.mockRestore();
    });

    it('authorize middleware should allow authorized role', () => {
      const req = { user: { role: 'admin' } };
      const res = {};
      const next = jest.fn();

      authorize('admin', 'moderator')(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('authorize middleware should reject unauthorized role with 403 Forbidden', () => {
      const req = { user: { role: 'user' } };
      const res = {};
      const next = jest.fn();

      authorize('admin')(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/do not have permission/);
    });
  });

  describe('CSRF & Origin Validation Middleware', () => {
    it('should allow safe read-only methods (GET, HEAD) without checking Origin', () => {
      const req = { method: 'GET', get: jest.fn() };
      const res = {};
      const next = jest.fn();

      csrfProtection(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow unsafe request from allowed origin', () => {
      process.env.CLIENT_ORIGIN = 'http://localhost:5500';
      const req = {
        method: 'POST',
        get: jest.fn().mockReturnValue('http://localhost:5500'),
      };
      const res = {};
      const next = jest.fn();

      csrfProtection(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should block unsafe cross-origin request from malicious origin', () => {
      process.env.CLIENT_ORIGIN = 'http://localhost:5500';
      process.env.NODE_ENV = 'production';
      const req = {
        method: 'POST',
        get: jest.fn().mockReturnValue('https://malicious-site.com'),
      };
      const res = {};
      const next = jest.fn();

      csrfProtection(req, res, next);
      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/Cross-origin request blocked/);
    });
  });
});
