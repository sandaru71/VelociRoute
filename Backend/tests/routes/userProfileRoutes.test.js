const request = require('supertest');
const express = require('express');
const { MongoClient } = require('mongodb');
require('../setup');

describe('User Profile Routes', () => {
  let app;
  let db;

  beforeAll(async () => {
    db = global.__MONGO_DB__;
    app = express();
    app.use(express.json());
    app.locals.db = db;
    
    const userProfileRoutes = require('../../src/Routes/userProfileRoutes');
    app.use('/api/users', userProfileRoutes);
  });

  describe('POST /api/users/profile', () => {
    it('should create a new user profile', async () => {
      const profileData = {
        userId: '123',
        displayName: 'John Doe',
        email: 'john@example.com',
        bio: 'Cycling enthusiast',
        preferredActivities: ['cycling', 'running']
      };

      const response = await request(app)
        .post('/api/users/profile')
        .send(profileData)
        .expect(201);

      expect(response.body).toMatchObject({
        userId: '123',
        displayName: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should return 400 for invalid profile data', async () => {
      const invalidData = {
        userId: '123'
        // Missing required fields
      };

      await request(app)
        .post('/api/users/profile')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/users/profile/:userId', () => {
    beforeEach(async () => {
      await db.collection('userProfiles').insertOne({
        userId: '123',
        displayName: 'John Doe',
        email: 'john@example.com',
        bio: 'Cycling enthusiast',
        preferredActivities: ['cycling', 'running'],
        createdAt: new Date()
      });
    });

    it('should get user profile by userId', async () => {
      const response = await request(app)
        .get('/api/users/profile/123')
        .expect(200);

      expect(response.body).toMatchObject({
        userId: '123',
        displayName: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/profile/nonexistent')
        .expect(404);
    });
  });

  describe('PUT /api/users/profile/:userId', () => {
    beforeEach(async () => {
      await db.collection('userProfiles').insertOne({
        userId: '123',
        displayName: 'John Doe',
        email: 'john@example.com',
        bio: 'Cycling enthusiast'
      });
    });

    it('should update user profile', async () => {
      const updateData = {
        displayName: 'John Doe Updated',
        bio: 'Running and cycling enthusiast'
      };

      const response = await request(app)
        .put('/api/users/profile/123')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        displayName: 'John Doe Updated',
        bio: 'Running and cycling enthusiast'
      });
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .put('/api/users/profile/nonexistent')
        .send({ displayName: 'Updated Name' })
        .expect(404);
    });
  });

  describe('GET /api/users/stats/:userId', () => {
    beforeEach(async () => {
      await db.collection('activities').insertMany([
        {
          userId: '123',
          activityType: 'cycling',
          distance: 15.5,
          duration: 3600,
          date: new Date()
        },
        {
          userId: '123',
          activityType: 'running',
          distance: 5,
          duration: 1800,
          date: new Date()
        }
      ]);
    });

    it('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/users/stats/123')
        .expect(200);

      expect(response.body).toMatchObject({
        totalDistance: 20.5,
        totalActivities: 2,
        activityBreakdown: {
          cycling: 1,
          running: 1
        }
      });
    });
  });
});
