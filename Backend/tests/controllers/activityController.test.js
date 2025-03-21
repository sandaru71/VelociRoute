const { MongoClient } = require('mongodb');
require('../setup');

describe('ActivityController', () => {
  let db;

  beforeAll(async () => {
    db = global.__MONGO_DB__;
  });

  describe('recordActivity', () => {
    it('should record a new activity successfully', async () => {
      const req = {
        body: {
          userId: '123',
          routeId: '456',
          activityType: 'cycling',
          distance: 15.5,
          duration: 3600, // 1 hour in seconds
          averageSpeed: 15.5,
          elevationGain: 100,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString()
        },
        app: { locals: { db } }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Import the controller here to ensure DB connection is ready
      const { recordActivity } = require('../../src/Controllers/activityController');
      await recordActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          activityType: 'cycling',
          distance: 15.5
        })
      );
    });

    it('should handle missing required fields', async () => {
      const req = {
        body: {
          userId: '123'
          // Missing other required fields
        },
        app: { locals: { db } }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const { recordActivity } = require('../../src/Controllers/activityController');
      await recordActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getActivities', () => {
    beforeEach(async () => {
      // Insert test activities
      await db.collection('activities').insertMany([
        {
          userId: '123',
          activityType: 'cycling',
          distance: 15.5,
          date: new Date()
        },
        {
          userId: '123',
          activityType: 'running',
          distance: 5,
          date: new Date()
        }
      ]);
    });

    it('should get activities for a user', async () => {
      const req = {
        query: { userId: '123' },
        app: { locals: { db } }
      };

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      const { getActivities } = require('../../src/Controllers/activityController');
      await getActivities(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: '123' })
        ])
      );
      expect(res.json.mock.calls[0][0]).toHaveLength(2);
    });
  });
});
