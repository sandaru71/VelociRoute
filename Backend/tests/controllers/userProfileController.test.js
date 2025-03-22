const { setupTestDB, closeTestDB, mockRequest, mockResponse } = require('../utils/testUtils');
const { createProfile, getProfile, updateProfile } = require('../../src/Controllers/userProfileController');

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'https://example.com/image.jpg' })
    }
  }
}));

describe('UserProfileController', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('createProfile', () => {
    it('should create a new user profile successfully', async () => {
      const req = mockRequest({
        body: {
          userId: '123',
          displayName: 'John Doe',
          email: 'john@example.com',
          bio: 'Cycling enthusiast',
          preferredActivities: ['cycling', 'running']
        },
        file: { path: 'test/profile.jpg' }
      });

      const res = mockResponse();

      await createProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: req.body.userId,
          displayName: req.body.displayName,
          email: req.body.email,
          profileImage: expect.any(String)
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      const req = mockRequest({
        body: {
          userId: '123'
          // Missing other required fields
        }
      });

      const res = mockResponse();

      await createProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      // First create a profile
      const createReq = mockRequest({
        body: {
          userId: '123',
          displayName: 'John Doe',
          email: 'john@example.com'
        }
      });

      const createRes = mockResponse();
      await createProfile(createReq, createRes);

      // Then get it
      const getReq = mockRequest({
        params: { userId: '123' }
      });

      const getRes = mockResponse();

      await getProfile(getReq, getRes);

      expect(getRes.status).toHaveBeenCalledWith(200);
      expect(getRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          displayName: 'John Doe',
          email: 'john@example.com'
        })
      );
    });

    it('should return 404 for non-existent profile', async () => {
      const req = mockRequest({
        params: { userId: 'nonexistent' }
      });

      const res = mockResponse();

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      // First create a profile
      const createReq = mockRequest({
        body: {
          userId: '123',
          displayName: 'John Doe',
          email: 'john@example.com'
        }
      });

      const createRes = mockResponse();
      await createProfile(createReq, createRes);

      // Then update it
      const updateReq = mockRequest({
        params: { userId: '123' },
        body: {
          displayName: 'John Smith',
          bio: 'Updated bio'
        },
        file: { path: 'test/new-profile.jpg' }
      });

      const updateRes = mockResponse();

      await updateProfile(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(updateRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          displayName: 'John Smith',
          bio: 'Updated bio',
          profileImage: expect.any(String)
        })
      );
    });

    it('should return 404 for non-existent profile', async () => {
      const req = mockRequest({
        params: { userId: 'nonexistent' },
        body: {
          displayName: 'New Name'
        }
      });

      const res = mockResponse();

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });
  });
});
