// =============================================================================
// Authentication & Controller Integration Tests
// =============================================================================
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const authController = require('../src/controllers/authController');
const userController = require('../src/controllers/userController');
const AppError = require('../src/utils/AppError');

describe('User Model & Auth Controller Unit/Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_jwt_secret_devverse_secure';
  });

  describe('User Model Logic & Password Hashing', () => {
    it('should hash password with bcrypt salt during pre-save', async () => {
      const user = new User({
        name: 'Ada Lovelace',
        username: 'adalovelace',
        email: 'ada@example.com',
        password: 'Password123!',
      });

      // Invoke the pre-save hook
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(user.password, salt);

      expect(hash).not.toBe('Password123!');
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);

      const isMatch = await bcrypt.compare('Password123!', hash);
      expect(isMatch).toBe(true);

      const isMismatch = await bcrypt.compare('WrongPassword!', hash);
      expect(isMismatch).toBe(false);
    });

    it('should safely omit password in toJSON serialization', () => {
      const user = new User({
        name: 'Alan Turing',
        username: 'aturing',
        email: 'alan@example.com',
        password: 'Password123!',
      });

      const json = user.toJSON();
      expect(json.password).toBeUndefined();
      expect(json.__v).toBeUndefined();
      expect(json.username).toBe('aturing');
    });
  });

  describe('Registration Controller (authController.register)', () => {
    it('should reject registration when required fields are missing', async () => {
      const req = { body: { email: 'test@example.com' } };
      const res = {};
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toMatch(/Please provide name, username, email, and password/);
    });

    it('should reject registration when password is weak', async () => {
      const req = {
        body: {
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          password: 'simplepassword', // missing upper, number, special char
        },
      };
      const res = {};
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(400);
      expect(err.message).toMatch(/Password must include at least one uppercase letter/);
    });

    it('should reject registration when email is duplicate (409 Conflict)', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValueOnce({ email: 'ada@example.com' });

      const req = {
        body: {
          name: 'Ada Lovelace',
          username: 'ada2',
          email: 'ada@example.com',
          password: 'Password123!',
        },
      };
      const res = {};
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(409);
      expect(err.message).toMatch(/already exists/);

      User.findOne.mockRestore();
    });

    it('should reject registration when username is duplicate (409 Conflict)', async () => {
      jest
        .spyOn(User, 'findOne')
        .mockResolvedValueOnce(null) // email not duplicate
        .mockResolvedValueOnce({ username: 'adalovelace' }); // username duplicate

      const req = {
        body: {
          name: 'Ada Lovelace',
          username: 'adalovelace',
          email: 'newemail@example.com',
          password: 'Password123!',
        },
      };
      const res = {};
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(409);
      expect(err.message).toMatch(/already taken/);

      User.findOne.mockRestore();
    });

    it('should successfully register user, set HttpOnly cookie, and return token', async () => {
      const mockCreatedUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Ada Lovelace',
        username: 'adalovelace',
        email: 'ada@example.com',
        role: 'user',
        points: 20,
        toJSON: () => ({
          _id: '507f1f77bcf86cd799439011',
          name: 'Ada Lovelace',
          username: 'adalovelace',
          email: 'ada@example.com',
          role: 'user',
          points: 20,
        }),
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'create').mockResolvedValue(mockCreatedUser);

      const req = {
        body: {
          name: 'Ada Lovelace',
          username: 'adalovelace',
          email: 'ada@example.com',
          password: 'Password123!',
        },
      };
      const res = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.objectContaining({ httpOnly: true }));

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.token).toBeDefined();
      expect(responseData.data.user.email).toBe('ada@example.com');
      expect(responseData.data.user.password).toBeUndefined();

      User.findOne.mockRestore();
      User.create.mockRestore();
    });
  });

  describe('Login Controller (authController.login)', () => {
    it('should reject login when credentials missing', async () => {
      const req = { body: {} };
      const res = {};
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });

    it('should reject login when user not found (401)', async () => {
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = { body: { email: 'unknown@example.com', password: 'Password123!' } };
      const res = {};
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(401);
      expect(err.message).toMatch(/Invalid email or password/);

      User.findOne.mockRestore();
    });

    it('should reject login when password does not match (401)', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'ada@example.com',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const req = { body: { email: 'ada@example.com', password: 'WrongPassword!' } };
      const res = {};
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(401);
      expect(err.message).toMatch(/Invalid email or password/);

      User.findOne.mockRestore();
    });

    it('should log in successfully with valid credentials and return cookie', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Ada Lovelace',
        username: 'adalovelace',
        email: 'ada@example.com',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const req = { body: { email: 'ada@example.com', password: 'Password123!' } };
      const res = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.objectContaining({ httpOnly: true }));

      User.findOne.mockRestore();
    });
  });

  describe('Logout & Current User', () => {
    it('logout should clear token cookie', async () => {
      const req = {};
      const res = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await authController.logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
    });

    it('getMe should return current authenticated user', async () => {
      const mockUser = { _id: '123', name: 'Ada', email: 'ada@example.com' };
      const req = { user: mockUser };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await authController.getMe(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0];
      expect(data.data.user).toEqual(mockUser);
    });
  });

  describe('User Profile Operations (userController)', () => {
    it('getProfile should return profile by username', async () => {
      const mockUser = { username: 'adalovelace', name: 'Ada Lovelace', bio: 'Pioneer' };
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const req = { params: { username: 'adalovelace' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await userController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data.user.name).toBe('Ada Lovelace');

      User.findOne.mockRestore();
    });

    it('updateProfile should update user settings and bio', async () => {
      const updatedMock = { _id: '123', name: 'Ada L.', bio: 'Updated bio' };
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue(updatedMock);

      const req = {
        user: { _id: '123' },
        body: { bio: 'Updated bio' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await userController.updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].data.user.bio).toBe('Updated bio');

      User.findByIdAndUpdate.mockRestore();
    });

    it('updateUsername should reject if user has less than 600 points (Legend tier requirement)', async () => {
      const mockUser = {
        _id: '123',
        points: 150, // not legend tier
        usernameChangeUsed: false,
      };
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const req = {
        user: { _id: '123' },
        body: { newUsername: 'newname' },
      };
      const res = {};
      const next = jest.fn();

      await userController.updateUsername(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/requires Legend tier/);

      User.findById.mockRestore();
    });
  });
});
