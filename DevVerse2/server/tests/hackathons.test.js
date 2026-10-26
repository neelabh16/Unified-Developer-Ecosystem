// =============================================================================
// Hackathon Controller Unit/Integration Tests
// =============================================================================
const hackathonController = require('../src/controllers/hackathonController');
const Hackathon = require('../src/models/Hackathon');
const HackathonRegistration = require('../src/models/HackathonRegistration');
const Engagement = require('../src/models/Engagement');
const User = require('../src/models/User');
const Activity = require('../src/models/Activity');

describe('Hackathon Controller Tests', () => {
  const validHackId = '507f1f77bcf86cd799439033';
  const validUserId = '507f1f77bcf86cd799439044';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toggleRegister should register user, increment participants, and award 20 points', async () => {
    const mockHackathon = {
      _id: { toString: () => validHackId },
      title: 'Aurora Hacks 2026',
      participantsCount: 50,
    };

    jest.spyOn(Hackathon, 'findById').mockResolvedValue(mockHackathon);
    jest.spyOn(HackathonRegistration, 'findOne').mockResolvedValue(null);
    jest.spyOn(HackathonRegistration, 'create').mockResolvedValue({});
    jest.spyOn(Hackathon, 'findByIdAndUpdate').mockResolvedValue({});
    jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
    jest.spyOn(Activity, 'create').mockResolvedValue({});

    const req = {
      params: { id: validHackId },
      user: { _id: validUserId },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await hackathonController.toggleRegister(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(HackathonRegistration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: validUserId,
        hackathon: mockHackathon._id,
      })
    );
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(validUserId, {
      $inc: { points: 20 },
    });

    Hackathon.findById.mockRestore();
    HackathonRegistration.findOne.mockRestore();
    HackathonRegistration.create.mockRestore();
    Hackathon.findByIdAndUpdate.mockRestore();
    User.findByIdAndUpdate.mockRestore();
    Activity.create.mockRestore();
  });
});
