const request = require('supertest');
const express = require('express');
const { MongoClient } = require('mongodb');
require('../setup');

describe('Activity Routes', () => {
  let app;
  let db;

  beforeAll(async () => {
    db = global.__MONGO_DB__;
    app = express();
    app.use(express.json());
    app.locals.db = db;
    
    // Import routes
    const activityRoutes = require('../../src/Routes/activityRoutes');
    app.use('/api/activities', activityRoutes);
  });

  describe('POST /api/activities/record', () => {
    it('should record a new activity', async () => {
      const activityData = {
        userId: '123',
        routeId: '456',
        activityType: 'cycling',
        distance: 15.5,
        duration: 3600,
        averageSpeed: 15.5,
        elevationGain: 100,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/activities/record')
        .send(activityData)
        .expect(201);

      expect(response.body).toMatchObject({
        userId: '123',
        activityType: 'cycling',
        distance: 15.5
      });
    });

    it('should return 400 for invalid activity data', async () => {
      const invalidData = {
        userId: '123'
        // Missing required fields
      };

      await request(app)
        .post('/api/activities/record')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/activities', () => {
    beforeEach(async () => {
      await db.collection('activities').insertMany([
        {
          userId: '123',
          activityType: 'cycling',
          distance: 15.5,
          date: new Date()
        },
        {
          userId: '123',
          activityType: 'running',
          distance: 5,
          date: new Date()
        }
      ]);
    });

    it('should get activities for a user', async () => {
      const response = await request(app)
        .get('/api/activities')
        .query({ userId: '123' })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('userId', '123');
    });

    it('should filter activities by type', async () => {
      const response = await request(app)
        .get('/api/activities')
        .query({ userId: '123', activityType: 'cycling' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('activityType', 'cycling');
    });
  });
});
