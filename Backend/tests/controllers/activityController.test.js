const { setupTestDB, closeTestDB, mockRequest, mockResponse } = require('../utils/testUtils');
const { recordActivity, getActivities } = require('../../src/Controllers/activityController');

describe('ActivityController', () => {
  let db;

  beforeAll(async () => {
    await setupTestDB();
    db = global.__MONGO_DB__;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('recordActivity', () => {
    it('should record a new activity successfully', async () => {
      const req = mockRequest({
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
      });

      const res = mockResponse();

      await recordActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: req.body.userId,
          activityType: req.body.activityType,
          distance: req.body.distance
        })
      );
    });

    it('should return 400 for invalid activity data', async () => {
      const req = mockRequest({
        body: {
          userId: '123',
          // Missing required fields
        },
        app: { locals: { db } }
      });

      const res = mockResponse();

      await recordActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });

    it('should return 500 for database errors', async () => {
      // Force a database error by passing invalid data type
      const req = mockRequest({
        body: {
          userId: 123, // Number instead of String to cause validation error
          routeId: '456',
          activityType: 'cycling',
          distance: 'invalid', // String instead of Number
          duration: 3600
        },
        app: { locals: { db } }
      });

      const res = mockResponse();

      await recordActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
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
      const req = mockRequest({
        query: { userId: '123' },
        app: { locals: { db } }
      });

      const res = mockResponse();

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
