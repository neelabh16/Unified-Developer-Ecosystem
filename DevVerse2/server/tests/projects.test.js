// =============================================================================
// Project Controller & CRUD Unit/Integration Tests
// =============================================================================
const projectController = require('../src/controllers/projectController');
const Project = require('../src/models/Project');
const Comment = require('../src/models/Comment');
const Engagement = require('../src/models/Engagement');
const User = require('../src/models/User');
const Activity = require('../src/models/Activity');
const AppError = require('../src/utils/AppError');

describe('Project CRUD & Engagement APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should reject creation when title, desc, or category is missing', async () => {
      const req = {
        body: { title: 'Test Project' },
        user: { _id: '507f1f77bcf86cd799439011', username: 'testuser' },
      };
      const res = {};
      const next = jest.fn();

      await projectController.createProject(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
    });

    it('should create project, award 25 points, and record in Activity', async () => {
      const mockProject = {
        _id: '607f1f77bcf86cd799439099',
        title: 'New Dev Tool',
        desc: 'A powerful tool for developers',
        category: 'Tools',
        tags: ['Rust', 'CLI'],
      };

      jest.spyOn(Project, 'create').mockResolvedValue(mockProject);
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
      jest.spyOn(Activity, 'create').mockResolvedValue({});

      const req = {
        body: {
          title: 'New Dev Tool',
          desc: 'A powerful tool for developers',
          category: 'Tools',
          tags: 'Rust, CLI',
        },
        user: { _id: '507f1f77bcf86cd799439011', username: 'testuser' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await projectController.createProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        $inc: { points: 25 },
      });
      expect(Activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 25,
          bucket: 'projectSubmit',
        })
      );

      Project.create.mockRestore();
      User.findByIdAndUpdate.mockRestore();
      Activity.create.mockRestore();
    });
  });

  describe('updateProject & deleteProject (Ownership checks)', () => {
    it('should reject update if user is not author or admin', async () => {
      const mockProject = {
        _id: '607f1f77bcf86cd799439099',
        author: { toString: () => '507f1f77bcf86cd799439011' }, // different user
      };

      jest.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { id: '607f1f77bcf86cd799439099' },
        body: { title: 'Updated Title' },
        user: { _id: { toString: () => 'another_user_id' }, role: 'user' },
      };
      const res = {};
      const next = jest.fn();

      await projectController.updateProject(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/not authorized/i);

      Project.findById.mockRestore();
    });

    it('should allow author to update project', async () => {
      const mockProject = {
        _id: '607f1f77bcf86cd799439099',
        author: { toString: () => '507f1f77bcf86cd799439011' },
        category: 'Old',
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Project, 'findById').mockResolvedValue(mockProject);

      const req = {
        params: { id: '607f1f77bcf86cd799439099' },
        body: { category: 'Frontend' },
        user: { _id: { toString: () => '507f1f77bcf86cd799439011' }, role: 'user' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await projectController.updateProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockProject.category).toBe('Frontend');
      expect(mockProject.save).toHaveBeenCalled();

      Project.findById.mockRestore();
    });
  });

  describe('Project Comments', () => {
    it('addComment should create comment and award 15 points', async () => {
      const mockProject = {
        _id: '607f1f77bcf86cd799439099',
        title: 'PulseDB',
      };
      const mockComment = {
        _id: 'comment_123',
        text: 'Great project architecture!',
      };

      jest.spyOn(Project, 'findById').mockResolvedValue(mockProject);
      jest.spyOn(Comment, 'create').mockResolvedValue(mockComment);
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
      jest.spyOn(User, 'findById').mockReturnValue({ select: jest.fn().mockResolvedValue({ points: 15 }) });
      jest.spyOn(Activity, 'create').mockResolvedValue({});

      const req = {
        params: { id: '607f1f77bcf86cd799439099' },
        body: { text: 'Great project architecture!' },
        user: {
          _id: '507f1f77bcf86cd799439011',
          username: 'commenter',
          name: 'Commenter Name',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await projectController.addComment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        $inc: { points: 15 },
      });

      Project.findById.mockRestore();
      Comment.create.mockRestore();
      User.findByIdAndUpdate.mockRestore();
      Activity.create.mockRestore();
    });
  });
});
