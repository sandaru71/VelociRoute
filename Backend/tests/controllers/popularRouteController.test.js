const { setupTestDB, closeTestDB, clearCollections, mockRequest, mockResponse } = require('../utils/testUtils');
const { getPopularRoutes, createPopularRoute } = require('../../src/Controllers/popularRouteController');

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://test-cloudinary-url.com/image.jpg'
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
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
  describe('getPopularRoutes', () => {
    it('should return empty array when no routes exist', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await getPopularRoutes(req, res);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should filter routes by activityType', async () => {
      // Insert test data
      await db.collection('routes').insertMany([
        { name: 'Route 1', activityType: 'cycling', difficulty: 'medium', distance: 10, location: 'Test' },
        { name: 'Route 2', activityType: 'running', difficulty: 'easy', distance: 5, location: 'Test' }
      ]);

      const req = mockRequest({
        query: { activityType: 'cycling' }
      });
      const res = mockResponse();

      await getPopularRoutes(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Route 1', activityType: 'cycling' })
        ])
      );
      expect(res.json.mock.calls[0][0]).toHaveLength(1);
    });

    it('should filter routes by distance range', async () => {
      // Insert test data
      await db.collection('routes').insertMany([
        { name: 'Short Route', activityType: 'cycling', difficulty: 'easy', distance: 5, location: 'Test' },
        { name: 'Medium Route', activityType: 'cycling', difficulty: 'medium', distance: 10, location: 'Test' },
        { name: 'Long Route', activityType: 'cycling', difficulty: 'hard', distance: 20, location: 'Test' }
      ]);

      const req = mockRequest({
        query: { minDistance: '8', maxDistance: '15' }
      });
      const res = mockResponse();

      await getPopularRoutes(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Medium Route', distance: 10 })
        ])
      );
      expect(res.json.mock.calls[0][0]).toHaveLength(1);
    });
  });

  describe('createPopularRoute', () => {
    const validRouteData = {
      name: 'Test Route',
      description: 'A test route',
      activityType: 'cycling',
      difficulty: 'medium',
      distance: '15.5',
      elevation: '100',
      averageTime: '60',
      location: 'Test Location'
    };

    it('should create a new route successfully', async () => {
      const req = mockRequest({
        body: validRouteData
      });
      const res = mockResponse();

      await createPopularRoute(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Route',
          activityType: 'cycling',
          difficulty: 'medium',
          distance: 15.5
        })
      );

      // Verify the route was actually created in the database
      const createdRoute = await db.collection('routes').findOne({ name: 'Test Route' });
      expect(createdRoute).toBeTruthy();
      expect(createdRoute.activityType).toBe('cycling');
    });

    it('should handle missing required fields', async () => {
      const req = mockRequest({
        body: {
          name: 'Test Route'
          // Missing other required fields
        }
      });
      const res = mockResponse();

      await createPopularRoute(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });

    it('should handle file uploads', async () => {
      const req = mockRequest({
        body: validRouteData,
        files: [{
          path: 'test/image.jpg'
        }]
      });
      const res = mockResponse();

      await createPopularRoute(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Route',
          images: expect.arrayContaining(['https://test-cloudinary-url.com/image.jpg'])
        })
      );
    });
  });
});
