const { getPopularRoutes, createPopularRoute } = require('../src/Controllers/popularRouteController');
const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let connection;
let db;

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Create connection to in-memory database
  connection = await MongoClient.connect(mongoUri);
  db = connection.db();
});

afterAll(async () => {
  // Clean up
  if (connection) await connection.close();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  // Clear the database before each test
  if (db) {
    await db.collection('routes').deleteMany({});
    await db.collection('popularroutes').deleteMany({});
  }
});

describe('PopularRouteController', () => {
  describe('getPopularRoutes', () => {
    it('should return empty array when no routes exist', async () => {
      const req = {
        query: {},
        app: { locals: { db } }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await getPopularRoutes(req, res);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should filter routes by activityType', async () => {
      // Insert test data
      const testRoutes = [
        { name: 'Route 1', activityType: 'cycling' },
        { name: 'Route 2', activityType: 'running' }
      ];
      await db.collection('routes').insertMany(testRoutes);

      const req = {
        query: { activityType: 'cycling' },
        app: { locals: { db } }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await getPopularRoutes(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Route 1', activityType: 'cycling' })
        ])
      );
      expect(res.json.mock.calls[0][0]).toHaveLength(1);
    });

    it('should filter routes by distance range', async () => {
      const testRoutes = [
        { name: 'Short Route', distance: 5 },
        { name: 'Medium Route', distance: 10 },
        { name: 'Long Route', distance: 20 }
      ];
      await db.collection('routes').insertMany(testRoutes);

      const req = {
        query: { minDistance: '8', maxDistance: '15' },
        app: { locals: { db } }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

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
    it('should create a new route successfully', async () => {
      const req = {
        body: {
          name: 'Test Route',
          description: 'A test route',
          activityType: 'Cycling',
          difficulty: 'Medium',
          distance: '15.5',
          elevation: '100',
          averageTime: '60',
          location: 'Test Location'
        },
        files: {},
        app: { locals: { db } }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

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
    });

    it('should handle missing required fields', async () => {
      const req = {
        body: {
          name: 'Test Route'
          // Missing other required fields
        },
        files: {},
        app: { locals: { db } }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createPopularRoute(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });
  });
});
