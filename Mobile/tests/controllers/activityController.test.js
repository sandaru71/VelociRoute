import { renderWithProviders, mockFetchResponse } from '../utils/testUtils';
import { recordActivity, getActivities } from '../../app/controllers/activityController';

describe('ActivityController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordActivity', () => {
    const mockActivity = {
      userId: '123',
      activityType: 'cycling',
      distance: 15.5,
      duration: 3600,
      averageSpeed: 15.5,
      elevationGain: 100,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    };

    it('should record activity successfully', async () => {
      const createdActivity = { ...mockActivity, id: '1' };
      mockFetchResponse(createdActivity);

      const result = await recordActivity(mockActivity);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/activities',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockActivity)
        }
      );
      expect(result).toEqual(createdActivity);
    });

    it('should handle validation errors', async () => {
      const errorMessage = 'Validation failed';
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: errorMessage
        })
      );

      const invalidActivity = { ...mockActivity, activityType: 'invalid' };

      await expect(recordActivity(invalidActivity)).rejects.toThrow(`HTTP error! status: 400 ${errorMessage}`);
    });
  });

  describe('getActivities', () => {
    it('should fetch user activities successfully', async () => {
      const mockActivities = [
        {
          id: '1',
          userId: '123',
          activityType: 'cycling',
          distance: 15.5
        }
      ];
      mockFetchResponse(mockActivities);

      const userId = '123';
      const activities = await getActivities(userId);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/activities?userId=${userId}`,
        expect.any(Object)
      );
      expect(activities).toEqual(mockActivities);
    });

    it('should handle empty response', async () => {
      mockFetchResponse([]);

      const activities = await getActivities('123');
      expect(activities).toEqual([]);
    });

    it('should handle network errors', async () => {
      const errorMessage = 'Network error';
      global.fetch = jest.fn(() => Promise.reject(new Error(errorMessage)));

      await expect(getActivities('123')).rejects.toThrow(errorMessage);
    });
  });
});
