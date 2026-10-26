const bookmarkController = require('../src/controllers/bookmarkController');
const activityController = require('../src/controllers/activityController');
const leaderboardController = require('../src/controllers/leaderboardController');
const Engagement = require('../src/models/Engagement');
const Activity = require('../src/models/Activity');
const Project = require('../src/models/Project');
const Hackathon = require('../src/models/Hackathon');
const User = require('../src/models/User');

jest.mock('../src/models/Engagement');
jest.mock('../src/models/Activity');
jest.mock('../src/models/Project');
jest.mock('../src/models/Hackathon');
jest.mock('../src/models/User');

describe('Bookmarks, Activity & Leaderboard Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: {},
      query: {},
      body: {},
      user: {
        _id: '507f191e810c19729de860ea',
        handle: 'testdev',
        points: 150,
        role: 'member'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('Bookmarks Controller', () => {
    it('getMyBookmarks should return user project and hackathon bookmarks', async () => {
      Engagement.find = jest.fn().mockResolvedValue([
        { _id: 'eng1', targetType: 'project', targetId: 'proj1' },
        { _id: 'eng2', targetType: 'hackathon', targetId: 'hack1' }
      ]);

      Project.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([{ _id: 'proj1', title: 'Project 1' }])
      });

      Hackathon.find = jest.fn().mockResolvedValue([{ _id: 'hack1', title: 'Hackathon 1' }]);

      await bookmarkController.getMyBookmarks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Bookmarks retrieved'
        })
      );
    });
  });

  describe('Activity & Ledger Controller', () => {
    it('getMyActivity should return user activity history and points ledger', async () => {
      Activity.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([
            { action: 'project_created', pointsEarned: 25, title: 'Published Project' }
          ])
        })
      });

      User.findById = jest.fn().mockResolvedValue({
        _id: req.user._id,
        points: 150
      });

      await activityController.getMyActivity(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Activity retrieved'
        })
      );
    });

    it('getGlobalFeed should support limit query and return recent activity', async () => {
      req.query = { limit: '10' };
      Activity.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([
              { action: 'joined_community', pointsEarned: 5, user: { username: 'alice' } }
            ])
          })
        })
      });

      await activityController.getGlobalFeed(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Global feed retrieved'
        })
      );
    });
  });

  describe('Leaderboard Controller', () => {
    it('getLeaderboard should return developer rankings sorted by points', async () => {
      req.query = { mode: 'devs', range: 'weekly' };
      User.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([
              { handle: 'topdev', name: 'Top Dev', points: 450 }
            ])
          })
        })
      });

      await leaderboardController.getLeaderboard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Developer leaderboard retrieved'
        })
      );
    });

    it('getLeaderboard should return project rankings when mode=projects', async () => {
      req.query = { mode: 'projects', range: 'all' };
      Project.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([
              { title: 'Top Project', likesCount: 100 }
            ])
          })
        })
      });

      await leaderboardController.getLeaderboard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Project leaderboard retrieved'
        })
      );
    });
  });
});
