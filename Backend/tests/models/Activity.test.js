const mongoose = require('mongoose');
const { setupTestDB, closeTestDB } = require('../utils/testUtils');
const Activity = require('../../src/Infrastructure/Models/Activity');

describe('Activity Model', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

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

  it('should require activityType', () => {
    const invalidActivityData = {
      userId: '123',
      routeId: '456',
      distance: 15.5
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });

  it('should validate activityType enum', () => {
    const invalidActivityData = {
      userId: '123',
      routeId: '456',
      activityType: 'invalid',
      distance: 15.5
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });

  it('should require distance', () => {
    const invalidActivityData = {
      userId: '123',
      routeId: '456',
      activityType: 'cycling'
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.distance).toBeDefined();
  });

  it('should validate minimum distance', () => {
    const invalidActivityData = {
      userId: '123',
      routeId: '456',
      activityType: 'cycling',
      distance: -1
    };

    const activity = new Activity(invalidActivityData);
    const validationError = activity.validateSync();
    expect(validationError.errors.distance).toBeDefined();
  });

  it('should save activity to database', async () => {
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
    const savedActivity = await activity.save();
    
    expect(savedActivity._id).toBeDefined();
    expect(savedActivity.userId).toBe(validActivityData.userId);
    expect(savedActivity.activityType).toBe(validActivityData.activityType);
    expect(savedActivity.distance).toBe(validActivityData.distance);
  });
});
