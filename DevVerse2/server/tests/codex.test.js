// =============================================================================
// Codex Controller Unit/Integration Tests
// =============================================================================
const codexController = require('../src/controllers/codexController');
const CodexEntry = require('../src/models/CodexEntry');
const User = require('../src/models/User');
const Activity = require('../src/models/Activity');
const AppError = require('../src/utils/AppError');

describe('Codex Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCodexEntry', () => {
    it('should reject contribution if user has fewer than 200 points', async () => {
      const req = {
        body: {
          title: 'The bug in production',
          category: 'Debugging',
          problem: 'Something broke at night',
          tried: 'Tried restarting',
          fix: 'Fixed the config',
          lesson: 'Always test configs',
        },
        user: { _id: 'user_123', points: 150, role: 'user' }, // under 200 pts
      };
      const res = {};
      const next = jest.fn();

      await codexController.createCodexEntry(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/requires at least 200 points/i);
    });

    it('should allow contribution when user has >= 200 points and award 25 points', async () => {
      const mockEntry = {
        _id: 'codex_123',
        title: 'The bug in production',
      };

      jest.spyOn(CodexEntry, 'create').mockResolvedValue(mockEntry);
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
      jest.spyOn(Activity, 'create').mockResolvedValue({});

      const req = {
        body: {
          title: 'The bug in production',
          category: 'Debugging',
          problem: 'Something broke at night',
          tried: 'Tried restarting',
          fix: 'Fixed the config',
          lesson: 'Always test configs',
        },
        user: { _id: 'user_123', username: 'kmori', points: 350, role: 'user' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await codexController.createCodexEntry(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user_123', {
        $inc: { points: 25 },
      });

      CodexEntry.create.mockRestore();
      User.findByIdAndUpdate.mockRestore();
      Activity.create.mockRestore();
    });
  });
});
