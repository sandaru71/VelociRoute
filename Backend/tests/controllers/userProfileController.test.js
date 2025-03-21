const { MongoClient } = require('mongodb');
require('../setup');

describe('UserProfileController', () => {
  let db;

  beforeAll(async () => {
    db = global.__MONGO_DB__;
  });

  describe('createUserProfile', () => {
    it('should create a new user profile successfully', async () => {
      const req = {
        body: {
          userId: '123',
          displayName: 'John Doe',
          email: 'john@example.com',
          bio: 'Cycling enthusiast',
          preferredActivities: ['cycling', 'running']
        },
        files: {}, // Mock empty files
        app: { locals: { db } }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const { createUserProfile } = require('../../src/Controllers/userProfileController');
      await createUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          displayName: 'John Doe',
          email: 'john@example.com'
        })
      );
    });

    it('should handle duplicate user profile creation', async () => {
      // First, create a profile
      await db.collection('userProfiles').insertOne({
        userId: '123',
        displayName: 'John Doe',
        email: 'john@example.com'
      });

      const req = {
        body: {
          userId: '123',
          displayName: 'John Doe Updated',
          email: 'john@example.com'
        },
        files: {},
        app: { locals: { db } }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const { createUserProfile } = require('../../src/Controllers/userProfileController');
      await createUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getUserProfile', () => {
    beforeEach(async () => {
      await db.collection('userProfiles').insertOne({
        userId: '123',
        displayName: 'John Doe',
        email: 'john@example.com',
        bio: 'Cycling enthusiast',
        preferredActivities: ['cycling', 'running'],
        createdAt: new Date()
      });
    });

    it('should get user profile by userId', async () => {
      const req = {
        params: { userId: '123' },
        app: { locals: { db } }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      const { getUserProfile } = require('../../src/Controllers/userProfileController');
      await getUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          displayName: 'John Doe',
          email: 'john@example.com'
        })
      );
    });

    it('should handle non-existent user profile', async () => {
      const req = {
        params: { userId: 'nonexistent' },
        app: { locals: { db } }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      const { getUserProfile } = require('../../src/Controllers/userProfileController');
      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUserProfile', () => {
    beforeEach(async () => {
      await db.collection('userProfiles').insertOne({
        userId: '123',
        displayName: 'John Doe',
        email: 'john@example.com',
        bio: 'Cycling enthusiast'
      });
    });

    it('should update user profile successfully', async () => {
      const req = {
        params: { userId: '123' },
        body: {
          displayName: 'John Doe Updated',
          bio: 'Running and cycling enthusiast'
        },
        files: {},
        app: { locals: { db } }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      const { updateUserProfile } = require('../../src/Controllers/userProfileController');
      await updateUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'John Doe Updated',
          bio: 'Running and cycling enthusiast'
        })
      );
    });
  });
});
