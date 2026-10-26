// =============================================================================
// Community & Discussion Controller Unit/Integration Tests
// =============================================================================
const communityController = require('../src/controllers/communityController');
const Community = require('../src/models/Community');
const Discussion = require('../src/models/Discussion');
const Engagement = require('../src/models/Engagement');
const User = require('../src/models/User');
const Activity = require('../src/models/Activity');
const AppError = require('../src/utils/AppError');

describe('Community & Discussion Controllers', () => {
  const validCommId = '507f1f77bcf86cd799439011';
  const validUserId = '507f1f77bcf86cd799439022';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleJoin', () => {
    it('should join community, increment membersCount, and award 5 points', async () => {
      const mockCommunity = {
        _id: { toString: () => validCommId },
        name: 'Rustaceans Guild',
        membersCount: 10,
      };

      jest.spyOn(Community, 'findById').mockResolvedValue(mockCommunity);
      jest.spyOn(Community, 'findOne').mockResolvedValue(mockCommunity);
      jest.spyOn(Engagement, 'findOne').mockResolvedValue(null); // not joined yet
      jest.spyOn(Engagement, 'create').mockResolvedValue({});
      jest.spyOn(Community, 'findByIdAndUpdate').mockResolvedValue({});
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
      jest.spyOn(Activity, 'create').mockResolvedValue({});

      const req = {
        params: { id: validCommId },
        user: { _id: validUserId },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await communityController.toggleJoin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Engagement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'join',
          targetType: 'community',
          targetId: validCommId,
        })
      );
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(validUserId, {
        $inc: { points: 5 },
      });

      Community.findById.mockRestore();
      Community.findOne.mockRestore();
      Engagement.findOne.mockRestore();
      Engagement.create.mockRestore();
      Community.findByIdAndUpdate.mockRestore();
      User.findByIdAndUpdate.mockRestore();
      Activity.create.mockRestore();
    });
  });

  describe('createCommunityDiscussion', () => {
    it('should reject discussion creation if user is not a community member', async () => {
      const mockCommunity = {
        _id: { toString: () => validCommId },
        slug: 'rustaceans-guild',
      };

      jest.spyOn(Community, 'findById').mockResolvedValue(mockCommunity);
      jest.spyOn(Community, 'findOne').mockResolvedValue(mockCommunity);
      jest.spyOn(Engagement, 'findOne').mockResolvedValue(null); // not a member

      const req = {
        params: { id: validCommId },
        body: { title: 'Raft vs Paxos', body: 'Which consensus algorithm do you prefer?' },
        user: { _id: validUserId, role: 'user' },
      };
      const res = {};
      const next = jest.fn();

      await communityController.createCommunityDiscussion(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/must join this community/i);

      Community.findById.mockRestore();
      Community.findOne.mockRestore();
      Engagement.findOne.mockRestore();
    });

    it('should create discussion and award 25 points when user is a member', async () => {
      const mockCommunity = {
        _id: { toString: () => validCommId },
        name: 'Rustaceans Guild',
        slug: 'rustaceans-guild',
      };
      const mockDiscussion = {
        _id: 'disc_123',
        title: 'Raft vs Paxos',
      };

      jest.spyOn(Community, 'findById').mockResolvedValue(mockCommunity);
      jest.spyOn(Community, 'findOne').mockResolvedValue(mockCommunity);
      jest.spyOn(Engagement, 'findOne').mockResolvedValue({ _id: 'eng_123' }); // member
      jest.spyOn(Discussion, 'create').mockResolvedValue(mockDiscussion);
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
      jest.spyOn(Activity, 'create').mockResolvedValue({});

      const req = {
        params: { id: validCommId },
        body: { title: 'Raft vs Paxos', body: 'Which consensus algorithm do you prefer?' },
        user: { _id: validUserId, username: 'kmori', name: 'Kenji', role: 'user' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await communityController.createCommunityDiscussion(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(validUserId, {
        $inc: { points: 25 },
      });

      Community.findById.mockRestore();
      Community.findOne.mockRestore();
      Engagement.findOne.mockRestore();
      Discussion.create.mockRestore();
      User.findByIdAndUpdate.mockRestore();
      Activity.create.mockRestore();
    });
  });
});
