import { Activity } from '../../app/models/Activity';

describe('Activity Model', () => {
  describe('validation', () => {
    it('should create a valid activity', () => {
      const activityData = {
        userId: '123',
        activityType: 'cycling',
        distance: 15.5,
        duration: 3600,
        averageSpeed: 15.5,
        elevationGain: 100,
        startTime: new Date(),
        endTime: new Date()
      };

      const activity = new Activity(activityData);
      expect(activity).toMatchObject(activityData);
    });

    it('should validate required fields', () => {
      const activity = new Activity({});
      expect(() => activity.validate()).toThrow();
    });

    it('should validate activity type', () => {
      const activity = new Activity({
        userId: '123',
        activityType: 'invalid',
        distance: 15.5
      });
      expect(() => activity.validate()).toThrow('Invalid activity type');
    });

    it('should validate numeric fields', () => {
      const activity = new Activity({
        userId: '123',
        activityType: 'cycling',
        distance: 'invalid',
        duration: -1
      });
      expect(() => activity.validate()).toThrow();
    });
  });

  describe('calculations', () => {
    it('should calculate average speed', () => {
      const activity = new Activity({
        distance: 10,
        duration: 3600 // 1 hour
      });
      expect(activity.calculateAverageSpeed()).toBe(10);
    });

    it('should calculate pace', () => {
      const activity = new Activity({
        distance: 5,
        duration: 1800 // 30 minutes
      });
      expect(activity.calculatePace()).toBe(6); // minutes per kilometer
    });
  });
});
