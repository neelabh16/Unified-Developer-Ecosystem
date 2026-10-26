// =============================================================================
// Squad Controller Unit/Integration Tests
// =============================================================================
const squadController = require('../src/controllers/squadController');
const Squad = require('../src/models/Squad');
const User = require('../src/models/User');
const Activity = require('../src/models/Activity');
const AppError = require('../src/utils/AppError');

describe('Squad Controller Tests', () => {
  const validUserId = '507f1f77bcf86cd799439055';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createSquad should reject when name or description is missing', async () => {
    const req = {
      body: { name: 'Alpha Squad' },
      user: { _id: validUserId },
    };
    const res = {};
    const next = jest.fn();

    await squadController.createSquad(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it('createSquad should create squad and award 20 points', async () => {
    const mockSquad = {
      _id: 'squad_123',
      name: 'Alpha Squad',
    };

    jest.spyOn(Squad, 'create').mockResolvedValue(mockSquad);
    jest.spyOn(Squad, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSquad),
      }),
    });
    jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
    jest.spyOn(Activity, 'create').mockResolvedValue({});

    const req = {
      body: { name: 'Alpha Squad', description: 'Building great things' },
      user: { _id: validUserId },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await squadController.createSquad(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(validUserId, {
      $inc: { points: 20 },
    });

    Squad.create.mockRestore();
    Squad.findById.mockRestore();
    User.findByIdAndUpdate.mockRestore();
    Activity.create.mockRestore();
  });
});
