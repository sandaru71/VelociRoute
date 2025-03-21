const { MongoClient } = require('mongodb');
require('../setup');

describe('ActivityPostsController', () => {
  let db;

  beforeAll(async () => {
    db = global.__MONGO_DB__;
  });

  describe('createActivityPost', () => {
    it('should create a new activity post successfully', async () => {
      const req = {
        body: {
          userId: '123',
          activityId: '456',
          caption: 'Great cycling session!',
          activityType: 'cycling',
          distance: 15.5,
          duration: 3600,
          location: 'Central Park'
        },
        files: {}, // Mock empty files
        app: { locals: { db } }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const { createActivityPost } = require('../../src/Controllers/activityPostsController');
      await createActivityPost(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          activityType: 'cycling',
          caption: 'Great cycling session!'
        })
      );
    });

    it('should handle missing required fields', async () => {
      const req = {
        body: {
          userId: '123'
          // Missing other required fields
        },
        files: {},
        app: { locals: { db } }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const { createActivityPost } = require('../../src/Controllers/activityPostsController');
      await createActivityPost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getActivityPosts', () => {
    beforeEach(async () => {
      // Insert test posts
      await db.collection('activityPosts').insertMany([
        {
          userId: '123',
          activityType: 'cycling',
          caption: 'Post 1',
          createdAt: new Date()
        },
        {
          userId: '123',
          activityType: 'running',
          caption: 'Post 2',
          createdAt: new Date()
        }
      ]);
    });

    it('should get activity posts for the feed', async () => {
      const req = {
        query: {},
        app: { locals: { db } }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      const { getActivityPosts } = require('../../src/Controllers/activityPostsController');
      await getActivityPosts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ caption: 'Post 1' }),
          expect.objectContaining({ caption: 'Post 2' })
        ])
      );
    });

    it('should filter posts by userId', async () => {
      const req = {
        query: { userId: '123' },
        app: { locals: { db } }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      const { getActivityPosts } = require('../../src/Controllers/activityPostsController');
      await getActivityPosts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: '123' })
        ])
      );
    });
  });
});
