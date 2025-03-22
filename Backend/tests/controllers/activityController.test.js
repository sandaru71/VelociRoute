const { setupTestDB, closeTestDB, mockRequest, mockResponse } = require('../utils/testUtils');
const { recordActivity, getActivities } = require('../../src/Controllers/activityController');
const Activity = require('../../src/Infrastructure/Models/Activity');

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/test-image.jpg' })
    }
  }
}));

describe('ActivityController', () => {
  let db;

  beforeAll(async () => {
    await setupTestDB();
    db = global.__MONGO_DB__;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await Activity.deleteMany({});
  });

  describe('recordActivity', () => {
    it('should record a new activity successfully', async () => {
      const activityData = {
        userId: '123',
        activityType: 'cycling',
        distance: 15.5,
        duration: 3600,
        averageSpeed: 15.5,
        elevationGain: 100,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      };

      const req = mockRequest({ body: activityData, app: { locals: { db } } });
      const res = mockResponse();

      await recordActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: activityData.userId,
          activityType: activityData.activityType,
          distance: activityData.distance
        })
      );
    });

    it('should handle validation errors', async () => {
      const req = mockRequest({
        body: {
          userId: '123',
          activityType: 'invalid-type',
          distance: -1
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
  });

  describe('getActivities', () => {
    beforeEach(async () => {
      await Activity.create([
        {
          userId: '123',
          activityType: 'cycling',
          distance: 15.5,
          duration: 3600,
          startTime: new Date()
        },
        {
          userId: '123',
          activityType: 'running',
          distance: 5.0,
          duration: 1800,
          startTime: new Date()
        },
        {
          userId: '456',
          activityType: 'cycling',
          distance: 20.0,
          duration: 4500,
          startTime: new Date()
        }
      ]);
    });

    it('should get activities for a specific user', async () => {
      const req = mockRequest({
        query: { userId: '123' },
        app: { locals: { db } }
      });
      const res = mockResponse();

      await getActivities(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: '123' })
        ])
      );
      const activities = res.json.mock.calls[0][0];
      expect(activities).toHaveLength(2);
    });

    it('should get all activities when no userId is provided', async () => {
      const req = mockRequest({
        query: {},
        app: { locals: { db } }
      });
      const res = mockResponse();

      await getActivities(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const activities = res.json.mock.calls[0][0];
      expect(activities).toHaveLength(3);
    });
  });
});
