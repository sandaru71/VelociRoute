const mongoose = require('mongoose');
const Activity = require('../../src/models/Activity');

describe('Activity Model', () => {
  beforeAll(async () => {
    // MongoDB connection is handled by setup.js
  });

  afterAll(async () => {
    // Cleanup is handled by setup.js
  });

  it('should create a valid activity', () => {
    const validActivityData = {
      userEmail: 'test@example.com',
      activityName: 'Morning Ride',
      activityType: 'cycling',
      difficulty: 'medium',
      distance: 15.5,
      stats: {
        duration: 3600,
        averageSpeed: 15.5,
        elevationGain: 100,
        startTime: new Date(),
        endTime: new Date()
      }
    };

    const activity = new Activity(validActivityData);
    const validationError = activity.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should require userEmail', () => {
    const invalidActivityData = {
      activityName: 'Morning Ride',
      activityType: 'cycling',
      difficulty: 'medium'
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.userEmail).toBeDefined();
  });

  it('should require activityType', () => {
    const invalidActivityData = {
      userEmail: 'test@example.com',
      activityName: 'Morning Ride',
      difficulty: 'medium'
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });

  it('should require difficulty', () => {
    const invalidActivityData = {
      userEmail: 'test@example.com',
      activityName: 'Morning Ride',
      activityType: 'cycling'
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.difficulty).toBeDefined();
  });

  it('should validate activityType enum', () => {
    const invalidActivityData = {
      userEmail: 'test@example.com',
      activityName: 'Morning Ride',
      activityType: 'invalid',
      difficulty: 'medium'
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });

  it('should validate difficulty enum', () => {
    const invalidActivityData = {
      userEmail: 'test@example.com',
      activityName: 'Morning Ride',
      activityType: 'cycling',
      difficulty: 'invalid'
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.difficulty).toBeDefined();
  });
});
