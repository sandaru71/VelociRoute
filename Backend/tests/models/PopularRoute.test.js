const mongoose = require('mongoose');
const { setupTestDB, closeTestDB } = require('../utils/testUtils');
const PopularRoute = require('../../src/Infrastructure/Models/PopularRoute');

describe('PopularRoute Model', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('should create a valid popular route', () => {
    const validRouteData = {
      name: 'Mountain Trail',
      description: 'Beautiful mountain trail with scenic views',
      activityType: 'cycling',
      difficulty: 'medium',
      distance: 15.5,
      elevation: 500,
      averageTime: 3600,
      location: 'Mountain Range',
      mapUrl: 'https://example.com/map',
      images: ['image1.jpg', 'image2.jpg']
    };

    const route = new PopularRoute(validRouteData);
    const validationError = route.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should require name', () => {
    const invalidRouteData = {
      activityType: 'cycling',
      difficulty: 'medium',
      distance: 15.5,
      location: 'Mountain Range'
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.name).toBeDefined();
  });

  it('should require activityType', () => {
    const invalidRouteData = {
      name: 'Mountain Trail',
      difficulty: 'medium',
      distance: 15.5,
      location: 'Mountain Range'
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });

  it('should validate activityType enum', () => {
    const invalidRouteData = {
      name: 'Mountain Trail',
      activityType: 'invalid',
      difficulty: 'medium',
      distance: 15.5,
      location: 'Mountain Range'
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });

  it('should require difficulty', () => {
    const invalidRouteData = {
      name: 'Mountain Trail',
      activityType: 'cycling',
      distance: 15.5,
      location: 'Mountain Range'
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.difficulty).toBeDefined();
  });

  it('should validate difficulty enum', () => {
    const invalidRouteData = {
      name: 'Mountain Trail',
      activityType: 'cycling',
      difficulty: 'invalid',
      distance: 15.5,
      location: 'Mountain Range'
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.difficulty).toBeDefined();
  });

  it('should require distance', () => {
    const invalidRouteData = {
      name: 'Mountain Trail',
      activityType: 'cycling',
      difficulty: 'medium',
      location: 'Mountain Range'
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.distance).toBeDefined();
  });

  it('should require location', () => {
    const invalidRouteData = {
      name: 'Mountain Trail',
      activityType: 'cycling',
      difficulty: 'medium',
      distance: 15.5
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.location).toBeDefined();
  });

  it('should save route to database', async () => {
    const validRouteData = {
      name: 'Mountain Trail',
      description: 'Beautiful mountain trail with scenic views',
      activityType: 'cycling',
      difficulty: 'medium',
      distance: 15.5,
      elevation: 500,
      averageTime: 3600,
      location: 'Mountain Range',
      mapUrl: 'https://example.com/map',
      images: ['image1.jpg', 'image2.jpg']
    };

    const route = new PopularRoute(validRouteData);
    const savedRoute = await route.save();
    
    expect(savedRoute._id).toBeDefined();
    expect(savedRoute.name).toBe(validRouteData.name);
    expect(savedRoute.activityType).toBe(validRouteData.activityType);
    expect(savedRoute.difficulty).toBe(validRouteData.difficulty);
    expect(savedRoute.distance).toBe(validRouteData.distance);
    expect(savedRoute.images).toEqual(validRouteData.images);
  });
});
