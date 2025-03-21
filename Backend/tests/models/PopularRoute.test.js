const PopularRoute = require('../../src/Infrastructure/Models/PopularRoute');

describe('PopularRoute Model', () => {
  it('should create a valid popular route', () => {
    const validRouteData = {
      name: 'Scenic Mountain Trail',
      description: 'Beautiful mountain cycling route',
      activityType: 'cycling',
      difficulty: 'medium',
      distance: 15.5,
      elevation: 500,
      averageTime: 60,
      location: 'Mountain Range',
      mapUrl: 'https://example.com/map.gpx',
      images: ['image1.jpg', 'image2.jpg']
    };

    const route = new PopularRoute(validRouteData);
    const validationError = route.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should require name', () => {
    const invalidRouteData = {
      description: 'Beautiful mountain cycling route',
      activityType: 'cycling',
      difficulty: 'medium',
      distance: 15.5
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.name).toBeDefined();
  });

  it('should validate difficulty enum', () => {
    const invalidRouteData = {
      name: 'Scenic Mountain Trail',
      activityType: 'cycling',
      difficulty: 'invalid_difficulty',
      distance: 15.5
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.difficulty).toBeDefined();
  });

  it('should validate activityType enum', () => {
    const invalidRouteData = {
      name: 'Scenic Mountain Trail',
      activityType: 'invalid_type',
      difficulty: 'medium',
      distance: 15.5
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });

  it('should require positive distance', () => {
    const invalidRouteData = {
      name: 'Scenic Mountain Trail',
      activityType: 'cycling',
      difficulty: 'medium',
      distance: -5
    };

    const route = new PopularRoute(invalidRouteData);
    const validationError = route.validateSync();
    expect(validationError.errors.distance).toBeDefined();
  });

  it('should set default values', () => {
    const minimalRouteData = {
      name: 'Scenic Mountain Trail',
      activityType: 'cycling',
      difficulty: 'medium',
      distance: 15.5,
      elevation: 500,
      averageTime: 60,
      location: 'Mountain Range'
    };

    const route = new PopularRoute(minimalRouteData);
    expect(route.images).toEqual([]);
    expect(route.createdAt).toBeInstanceOf(Date);
    expect(route.updatedAt).toBeInstanceOf(Date);
  });
});
