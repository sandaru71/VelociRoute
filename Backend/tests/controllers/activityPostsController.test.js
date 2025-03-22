const { setupTestDB, closeTestDB, mockRequest, mockResponse } = require('../utils/testUtils');
const { createPost, getPosts, likePost, commentOnPost } = require('../../src/Controllers/activityPostsController');
const Activitypost = require('../../src/Infrastructure/Models/ActivityPosts');

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/test-image.jpg' })
    }
  }
}));

describe('ActivityPostsController', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await Activitypost.deleteMany({});
  });

  describe('createPost', () => {
    it('should create a new post successfully', async () => {
      const postData = {
        userId: '123',
        activityId: '456',
        caption: 'Great ride!',
        activityType: 'cycling',
        distance: 15.5,
        duration: 3600,
        location: 'Central Park'
      };

      const req = mockRequest({ body: postData });
      const res = mockResponse();

      await createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: postData.userId,
          activityId: postData.activityId,
          caption: postData.caption
        })
      );
    });

    it('should handle validation errors', async () => {
      const req = mockRequest({
        body: {
          userId: '123',
          activityType: 'invalid-type'
        }
      });
      const res = mockResponse();

      await createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });
  });

  describe('getPosts', () => {
    beforeEach(async () => {
      await Activitypost.create([
        {
          userId: '123',
          activityId: '456',
          caption: 'First post',
          activityType: 'cycling',
          distance: 15.5,
          duration: 3600,
          location: 'Central Park',
          createdAt: new Date()
        },
        {
          userId: '123',
          activityId: '789',
          caption: 'Second post',
          activityType: 'running',
          distance: 5.0,
          duration: 1800,
          location: 'Riverside Park',
          createdAt: new Date()
        },
        {
          userId: '456',
          activityId: '012',
          caption: 'Third post',
          activityType: 'cycling',
          distance: 20.0,
          duration: 4500,
          location: 'Brooklyn Bridge',
          createdAt: new Date()
        }
      ]);
    });

    it('should get posts for a specific user', async () => {
      const req = mockRequest({
        query: { userId: '123' }
      });
      const res = mockResponse();

      await getPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: '123' })
        ])
      );
      const posts = res.json.mock.calls[0][0];
      expect(posts).toHaveLength(2);
    });

    it('should get all posts when no userId is provided', async () => {
      const req = mockRequest({
        query: {}
      });
      const res = mockResponse();

      await getPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const posts = res.json.mock.calls[0][0];
      expect(posts).toHaveLength(3);
    });
  });

  describe('likePost', () => {
    let post;

    beforeEach(async () => {
      post = await Activitypost.create({
        userId: '123',
        activityId: '456',
        caption: 'Test post',
        activityType: 'cycling',
        distance: 15.5,
        duration: 3600,
        location: 'Central Park',
        likes: []
      });
    });

    it('should add a like to a post', async () => {
      const req = mockRequest({
        params: { postId: post._id.toString() },
        body: { userId: '789' }
      });
      const res = mockResponse();

      await likePost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedPost = res.json.mock.calls[0][0];
      expect(updatedPost.likes).toContain('789');
    });

    it('should remove a like from a post', async () => {
      // First add a like
      post.likes.push('789');
      await post.save();

      const req = mockRequest({
        params: { postId: post._id.toString() },
        body: { userId: '789' }
      });
      const res = mockResponse();

      await likePost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedPost = res.json.mock.calls[0][0];
      expect(updatedPost.likes).not.toContain('789');
    });
  });

  describe('commentOnPost', () => {
    let post;

    beforeEach(async () => {
      post = await Activitypost.create({
        userId: '123',
        activityId: '456',
        caption: 'Test post',
        activityType: 'cycling',
        distance: 15.5,
        duration: 3600,
        location: 'Central Park',
        comments: []
      });
    });

    it('should add a comment to a post', async () => {
      const req = mockRequest({
        params: { postId: post._id.toString() },
        body: {
          userId: '789',
          content: 'Great post!'
        }
      });
      const res = mockResponse();

      await commentOnPost(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const updatedPost = res.json.mock.calls[0][0];
      expect(updatedPost.comments).toHaveLength(1);
      expect(updatedPost.comments[0]).toEqual(
        expect.objectContaining({
          userId: '789',
          content: 'Great post!'
        })
      );
    });
  });
});
