const Activity = require('../../src/Infrastructure/Models/Activity');

describe('Activity Model', () => {
  it('should create a valid activity', () => {
    const validActivityData = {
      userId: '123',
      routeId: '456',
      activityType: 'cycling',
      distance: 15.5,
      duration: 3600,
      averageSpeed: 15.5,
      elevationGain: 100,
      startTime: new Date(),
      endTime: new Date()
    };

    const activity = new Activity(validActivityData);
    const validationError = activity.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should require userId', () => {
    const invalidActivityData = {
      routeId: '456',
      activityType: 'cycling',
      distance: 15.5
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.userId).toBeDefined();
  });

  it('should validate activityType enum', () => {
    const invalidActivityData = {
      userId: '123',
      routeId: '456',
      activityType: 'invalid_type',
      distance: 15.5
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });

  it('should require positive distance', () => {
    const invalidActivityData = {
      userId: '123',
      routeId: '456',
      activityType: 'cycling',
      distance: -5
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.distance).toBeDefined();
  });
});
