const request = require('supertest');
const express = require('express');
const { MongoClient } = require('mongodb');
require('../setup');

describe('Popular Routes', () => {
  let app;
  let db;

  beforeAll(async () => {
    db = global.__MONGO_DB__;
    app = express();
    app.use(express.json());
    app.locals.db = db;
    
    const popularRoutes = require('../../src/Routes/popularRoutes');
    app.use('/api/routes', popularRoutes);
  });

  describe('GET /api/routes', () => {
    beforeEach(async () => {
      await db.collection('routes').insertMany([
        {
          name: 'Mountain Trail',
          activityType: 'cycling',
          difficulty: 'hard',
          distance: 20,
          location: 'Mountain Range',
          elevation: 500
        },
        {
          name: 'City Loop',
          activityType: 'running',
          difficulty: 'medium',
          distance: 5,
          location: 'Downtown',
          elevation: 100
        }
      ]);
    });

    it('should get all routes', async () => {
      const response = await request(app)
        .get('/api/routes')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should filter routes by activity type', async () => {
      const response = await request(app)
        .get('/api/routes')
        .query({ activityType: 'cycling' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('activityType', 'cycling');
    });

    it('should filter routes by difficulty', async () => {
      const response = await request(app)
        .get('/api/routes')
        .query({ difficulty: 'hard' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('difficulty', 'hard');
    });

    it('should filter routes by distance range', async () => {
      const response = await request(app)
        .get('/api/routes')
        .query({ minDistance: '15', maxDistance: '25' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('name', 'Mountain Trail');
    });

    it('should filter routes by location', async () => {
      const response = await request(app)
        .get('/api/routes')
        .query({ location: 'Mountain' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('name', 'Mountain Trail');
    });
  });

  describe('POST /api/routes', () => {
    it('should create a new route', async () => {
      const routeData = {
        name: 'Beach Path',
        description: 'Scenic beach route',
        activityType: 'running',
        difficulty: 'easy',
        distance: 3,
        elevation: 50,
        averageTime: 30,
        location: 'Coastal Area'
      };

      const response = await request(app)
        .post('/api/routes')
        .send(routeData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Beach Path',
        activityType: 'running',
        difficulty: 'easy'
      });
    });

    it('should return 400 for invalid route data', async () => {
      const invalidData = {
        name: 'Invalid Route'
        // Missing required fields
      };

      await request(app)
        .post('/api/routes')
        .send(invalidData)
        .expect(400);
    });
  });
});
