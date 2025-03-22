const { setupTestDB, closeTestDB, clearCollections, mockRequest, mockResponse } = require('../utils/testUtils');
const { getRoutes, createRoute } = require('../../src/controllers/popularRouteController');
const PopularRoute = require('../../src/models/PopularRoute');

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/test-image.jpg' })
    }
  }
}));

describe('PopularRouteController', () => {
  let db;

  beforeAll(async () => {
    const testDB = await setupTestDB();
    db = testDB.db;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearCollections(db);
    jest.clearAllMocks();
  });

  describe('getRoutes', () => {
    it('should return all routes when no query parameters are provided', async () => {
      // Arrange
      const mockRoutes = [
        {
          name: 'Route 1',
          description: 'Test route 1',
          activityType: 'cycling',
          difficulty: 'medium',
          distance: 10,
          location: 'Test Location 1'
        },
        {
          name: 'Route 2',
          description: 'Test route 2',
          activityType: 'running',
          difficulty: 'easy',
          distance: 5,
          location: 'Test Location 2'
        }
      ];
      await PopularRoute.create(mockRoutes);

      const req = mockRequest();
      const res = mockResponse();

      // Act
      await getRoutes(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ name: 'Route 1', activityType: 'cycling' }),
        expect.objectContaining({ name: 'Route 2', activityType: 'running' })
      ]));
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      jest.spyOn(PopularRoute, 'find').mockRejectedValue(new Error('Database error'));

      // Act
      await getRoutes(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Internal server error'
      }));
    });

    it('should filter routes by activity type', async () => {
      // Arrange
      const mockRoutes = [
        {
          name: 'Cycling Route',
          description: 'Test cycling route',
          activityType: 'cycling',
          difficulty: 'medium',
          distance: 20,
          location: 'Test Location'
        },
        {
          name: 'Running Route',
          description: 'Test running route',
          activityType: 'running',
          difficulty: 'easy',
          distance: 5,
          location: 'Test Location'
        }
      ];
      await PopularRoute.create(mockRoutes);

      const req = mockRequest({ query: { activityType: 'cycling' } });
      const res = mockResponse();

      // Act
      await getRoutes(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      const routes = res.json.mock.calls[0][0];
      expect(routes).toHaveLength(1);
      expect(routes[0].activityType).toBe('cycling');
    });
  });

  describe('createRoute', () => {
    it('should create a new route successfully', async () => {
      // Arrange
      const routeData = {
        name: 'New Route',
        description: 'Test route',
        activityType: 'cycling',
        difficulty: 'medium',
        distance: 15,
        elevation: 100,
        averageTime: 3600,
        location: 'Test Location',
        coordinates: {
          start: { latitude: 0, longitude: 0 },
          end: { latitude: 1, longitude: 1 }
        }
      };
      const req = mockRequest({ body: routeData });
      const res = mockResponse();

      // Act
      await createRoute(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        name: routeData.name,
        activityType: routeData.activityType,
        difficulty: routeData.difficulty,
        distance: routeData.distance,
        location: routeData.location
      }));
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = mockRequest({ body: {} }); // Missing required fields
      const res = mockResponse();

      // Act
      await createRoute(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Missing required fields')
      }));
    });
  });
});
