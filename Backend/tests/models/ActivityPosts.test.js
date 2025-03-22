const mongoose = require('mongoose');
const { setupTestDB, closeTestDB } = require('../utils/testUtils');
const ActivityPosts = require('../../src/Infrastructure/Models/ActivityPosts');

describe('ActivityPosts Model', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('should create a valid activity post', () => {
    const validPostData = {
      userId: '123',
      activityId: '456',
      caption: 'Great ride!',
      activityType: 'cycling',
      distance: 15.5,
      duration: 3600,
      location: 'Mountain Trail',
      images: ['image1.jpg', 'image2.jpg']
    };

    const post = new ActivityPosts(validPostData);
    const validationError = post.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should require userId', () => {
    const invalidPostData = {
      activityId: '456',
      caption: 'Great ride!',
      activityType: 'cycling'
    };

    const post = new ActivityPosts(invalidPostData);
    const validationError = post.validateSync();
    expect(validationError.errors.userId).toBeDefined();
  });

  it('should require activityId', () => {
    const invalidPostData = {
      userId: '123',
      caption: 'Great ride!',
      activityType: 'cycling'
    };

    const post = new ActivityPosts(invalidPostData);
    const validationError = post.validateSync();
    expect(validationError.errors.activityId).toBeDefined();
  });

  it('should require activityType', () => {
    const invalidPostData = {
      userId: '123',
      activityId: '456',
      caption: 'Great ride!'
    };

    const post = new ActivityPosts(invalidPostData);
    const validationError = post.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });

  it('should validate activityType enum', () => {
    const invalidPostData = {
      userId: '123',
      activityId: '456',
      caption: 'Great ride!',
      activityType: 'invalid'
    };

    const post = new ActivityPosts(invalidPostData);
    const validationError = post.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });

  it('should default likes to 0', () => {
    const postData = {
      userId: '123',
      activityId: '456',
      activityType: 'cycling'
    };

    const post = new ActivityPosts(postData);
    expect(post.likes).toBe(0);
  });

  it('should save post to database', async () => {
    const validPostData = {
      userId: '123',
      activityId: '456',
      caption: 'Great ride!',
      activityType: 'cycling',
      distance: 15.5,
      duration: 3600,
      location: 'Mountain Trail',
      images: ['image1.jpg', 'image2.jpg']
    };

    const post = new ActivityPosts(validPostData);
    const savedPost = await post.save();
    
    expect(savedPost._id).toBeDefined();
    expect(savedPost.userId).toBe(validPostData.userId);
    expect(savedPost.activityType).toBe(validPostData.activityType);
    expect(savedPost.images).toEqual(validPostData.images);
    expect(savedPost.likes).toBe(0);
  });
});
