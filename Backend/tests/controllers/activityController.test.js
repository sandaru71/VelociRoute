const { mockRequest, mockResponse } = require('../utils/testUtils');
const { recordActivity, getActivities } = require('../../src/controllers/activityController');
const Activity = require('../../src/models/Activity');

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/test-image.jpg' })
    }
  }
}));

describe('ActivityController', () => {
  beforeEach(async () => {
    await Activity.deleteMany({});
  });

  describe('recordActivity', () => {
    it('should record a new activity successfully', async () => {
      const activityData = {
        userEmail: 'test@example.com',
        activityName: 'Morning Ride',
        activityType: 'cycling',
        difficulty: 'medium',
        stats: {
          distance: 15.5,
          duration: 3600,
          averageSpeed: 15.5,
          elevationGain: 100,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString()
        }
      };

      const req = mockRequest({ body: activityData });
      const res = mockResponse();

      await recordActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: activityData.userEmail,
          activityType: activityData.activityType,
          difficulty: activityData.difficulty
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      const invalidActivityData = {
        activityName: 'Morning Ride',
        activityType: 'cycling'
      };

      const req = mockRequest({ body: invalidActivityData });
      const res = mockResponse();

      await recordActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('required')
        })
      );
    });

    it('should return 400 for invalid activity type', async () => {
      const invalidActivityData = {
        userEmail: 'test@example.com',
        activityName: 'Morning Ride',
        activityType: 'invalid',
        difficulty: 'medium'
      };

      const req = mockRequest({ body: invalidActivityData });
      const res = mockResponse();

      await recordActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('activityType')
        })
      );
    });

    it('should handle image uploads', async () => {
      const activityData = {
        userEmail: 'test@example.com',
        activityName: 'Morning Ride',
        activityType: 'cycling',
        difficulty: 'medium',
        images: ['test-image-1.jpg', 'test-image-2.jpg']
      };

      const req = mockRequest({ body: activityData });
      const res = mockResponse();

      await recordActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          images: expect.arrayContaining([
            'https://cloudinary.com/test-image.jpg',
            'https://cloudinary.com/test-image.jpg'
          ])
        })
      );
    });
  });

  describe('getActivities', () => {
    beforeEach(async () => {
      const activities = [
        {
          userEmail: 'test@example.com',
          activityName: 'Morning Ride',
          activityType: 'cycling',
          difficulty: 'medium',
          stats: {
            distance: 15.5,
            duration: 3600,
            averageSpeed: 15.5
          }
        },
        {
          userEmail: 'test@example.com',
          activityName: 'Evening Run',
          activityType: 'running',
          difficulty: 'hard',
          stats: {
            distance: 10,
            duration: 3000,
            averageSpeed: 12
          }
        }
      ];
      await Activity.create(activities);
    });

    it('should get all activities for a user', async () => {
      const req = mockRequest({
        query: { userEmail: 'test@example.com' }
      });
      const res = mockResponse();

      await getActivities(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userEmail: 'test@example.com',
            activityType: 'cycling'
          }),
          expect.objectContaining({
            userEmail: 'test@example.com',
            activityType: 'running'
          })
        ])
      );
    });

    it('should filter activities by type', async () => {
      const req = mockRequest({
        query: {
          userEmail: 'test@example.com',
          activityType: 'cycling'
        }
      });
      const res = mockResponse();

      await getActivities(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const activities = res.json.mock.calls[0][0];
      expect(activities).toHaveLength(1);
      expect(activities[0].activityType).toBe('cycling');
    });

    it('should return empty array for non-existent user', async () => {
      const req = mockRequest({
        query: { userEmail: 'nonexistent@example.com' }
      });
      const res = mockResponse();

      await getActivities(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const activities = res.json.mock.calls[0][0];
      expect(activities).toHaveLength(0);
    });
  });
});
