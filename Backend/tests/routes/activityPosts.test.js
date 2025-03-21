const request = require('supertest');
const express = require('express');
const { MongoClient } = require('mongodb');
require('../setup');

describe('Activity Posts Routes', () => {
  let app;
  let db;

  beforeAll(async () => {
    db = global.__MONGO_DB__;
    app = express();
    app.use(express.json());
    app.locals.db = db;
    
    const activityPostsRoutes = require('../../src/Routes/activityPosts');
    app.use('/api/posts', activityPostsRoutes);
  });

  describe('POST /api/posts', () => {
    it('should create a new activity post', async () => {
      const postData = {
        userId: '123',
        activityId: '456',
        caption: 'Great cycling session!',
        activityType: 'cycling',
        distance: 15.5,
        duration: 3600,
        location: 'Central Park'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(201);

      expect(response.body).toMatchObject({
        userId: '123',
        caption: 'Great cycling session!',
        activityType: 'cycling'
      });
    });

    it('should return 400 for invalid post data', async () => {
      const invalidData = {
        userId: '123'
        // Missing required fields
      };

      await request(app)
        .post('/api/posts')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      await db.collection('activityPosts').insertMany([
        {
          userId: '123',
          activityType: 'cycling',
          caption: 'Post 1',
          createdAt: new Date()
        },
        {
          userId: '123',
          activityType: 'running',
          caption: 'Post 2',
          createdAt: new Date()
        }
      ]);
    });

    it('should get all activity posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should get posts by userId', async () => {
      const response = await request(app)
        .get('/api/posts')
        .query({ userId: '123' })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('userId', '123');
    });
  });

  describe('POST /api/posts/:postId/like', () => {
    let postId;

    beforeEach(async () => {
      const result = await db.collection('activityPosts').insertOne({
        userId: '123',
        activityType: 'cycling',
        caption: 'Test post',
        likes: 0
      });
      postId = result.insertedId.toString();
    });

    it('should increment post likes', async () => {
      const response = await request(app)
        .post(`/api/posts/${postId}/like`)
        .send({ userId: '456' })
        .expect(200);

      expect(response.body.likes).toBe(1);
    });
  });

  describe('POST /api/posts/:postId/comment', () => {
    let postId;

    beforeEach(async () => {
      const result = await db.collection('activityPosts').insertOne({
        userId: '123',
        activityType: 'cycling',
        caption: 'Test post',
        comments: []
      });
      postId = result.insertedId.toString();
    });

    it('should add comment to post', async () => {
      const commentData = {
        userId: '456',
        text: 'Great activity!'
      };

      const response = await request(app)
        .post(`/api/posts/${postId}/comment`)
        .send(commentData)
        .expect(200);

      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0]).toMatchObject({
        userId: '456',
        text: 'Great activity!'
      });
    });
  });
});
