const { setupTestDB, closeTestDB, clearCollections, mockRequest, mockResponse } = require('../utils/testUtils');
const { getRoutes, createRoute } = require('../../src/Controllers/popularRouteController');
const PopularRoute = require('../../src/Infrastructure/Models/PopularRoute');

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/test-image.jpg' })
    }
  }
}));

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

describe('PopularRouteController', () => {
  describe('createRoute', () => {
    it('should create a new route successfully', async () => {
      const routeData = {
        name: 'Central Park Loop',
        description: 'A scenic route around Central Park',
        activityType: 'cycling',
        difficulty: 'medium',
        distance: 10.5,
        elevation: 150,
        averageTime: 3600,
        location: 'New York, NY'
      };

      const req = mockRequest({ body: routeData });
      const res = mockResponse();

      await createRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: routeData.name,
          activityType: routeData.activityType,
          difficulty: routeData.difficulty
        })
      );
    });

    it('should handle validation errors', async () => {
      const req = mockRequest({
        body: {
          name: 'Test Route',
          activityType: 'invalid-type',
          difficulty: 'super-hard'
        }
      });
      const res = mockResponse();

      await createRoute(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });
  });

  describe('getRoutes', () => {
    beforeEach(async () => {
      await PopularRoute.create([
        {
          name: 'Central Park Loop',
          description: 'A scenic route around Central Park',
          activityType: 'cycling',
          difficulty: 'medium',
          distance: 10.5,
          elevation: 150,
          averageTime: 3600,
          location: 'New York, NY'
        },
        {
          name: 'Riverside Run',
          description: 'A flat run along the river',
          activityType: 'running',
          difficulty: 'easy',
          distance: 5.0,
          elevation: 50,
          averageTime: 1800,
          location: 'New York, NY'
        },
        {
          name: 'Brooklyn Bridge Ride',
          description: 'Cross the iconic Brooklyn Bridge',
          activityType: 'cycling',
          difficulty: 'hard',
          distance: 15.0,
          elevation: 300,
          averageTime: 4500,
          location: 'Brooklyn, NY'
        }
      ]);
    });

    it('should get routes filtered by activity type', async () => {
      const req = mockRequest({
        query: { activityType: 'cycling' }
      });
      const res = mockResponse();

      await getRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const routes = res.json.mock.calls[0][0];
      expect(routes).toHaveLength(2);
      expect(routes.every(route => route.activityType === 'cycling')).toBe(true);
    });

    it('should get routes filtered by difficulty', async () => {
      const req = mockRequest({
        query: { difficulty: 'easy' }
      });
      const res = mockResponse();

      await getRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const routes = res.json.mock.calls[0][0];
      expect(routes).toHaveLength(1);
      expect(routes[0].difficulty).toBe('easy');
    });

    it('should get routes filtered by distance range', async () => {
      const req = mockRequest({
        query: {
          minDistance: 5,
          maxDistance: 12
        }
      });
      const res = mockResponse();

      await getRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const routes = res.json.mock.calls[0][0];
      expect(routes.every(route => route.distance >= 5 && route.distance <= 12)).toBe(true);
    });

    it('should get routes filtered by location', async () => {
      const req = mockRequest({
        query: { location: 'Brooklyn' }
      });
      const res = mockResponse();

      await getRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const routes = res.json.mock.calls[0][0];
      expect(routes).toHaveLength(1);
      expect(routes[0].location).toMatch(/Brooklyn/);
    });

    it('should get all routes when no filters are provided', async () => {
      const req = mockRequest({
        query: {}
      });
      const res = mockResponse();

      await getRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const routes = res.json.mock.calls[0][0];
      expect(routes).toHaveLength(3);
    });
  });
});
