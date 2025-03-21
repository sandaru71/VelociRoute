const ActivityPosts = require('../../src/Infrastructure/Models/ActivityPosts');

describe('ActivityPosts Model', () => {
  it('should create a valid activity post', () => {
    const validPostData = {
      userId: '123',
      activityId: '456',
      caption: 'Great cycling session!',
      activityType: 'cycling',
      distance: 15.5,
      duration: 3600,
      location: 'Central Park',
      images: ['image1.jpg', 'image2.jpg']
    };

    const post = new ActivityPosts(validPostData);
    const validationError = post.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should require userId', () => {
    const invalidPostData = {
      activityId: '456',
      caption: 'Great cycling session!',
      activityType: 'cycling'
    };

    const post = new ActivityPosts(invalidPostData);
    const validationError = post.validateSync();
    expect(validationError.errors.userId).toBeDefined();
  });

  it('should require activityId', () => {
    const invalidPostData = {
      userId: '123',
      caption: 'Great cycling session!',
      activityType: 'cycling'
    };

    const post = new ActivityPosts(invalidPostData);
    const validationError = post.validateSync();
    expect(validationError.errors.activityId).toBeDefined();
  });

  it('should set default values', () => {
    const minimalPostData = {
      userId: '123',
      activityId: '456',
      activityType: 'cycling'
    };

    const post = new ActivityPosts(minimalPostData);
    expect(post.images).toEqual([]);
    expect(post.likes).toBe(0);
    expect(post.comments).toEqual([]);
    expect(post.createdAt).toBeInstanceOf(Date);
  });

  it('should validate activityType enum', () => {
    const invalidPostData = {
      userId: '123',
      activityId: '456',
      activityType: 'invalid_type'
    };

    const post = new ActivityPosts(invalidPostData);
    const validationError = post.validateSync();
    expect(validationError.errors.activityType).toBeDefined();
  });
});
