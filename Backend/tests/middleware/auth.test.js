const auth = require('../../src/middleware/auth');
const { mockRequest, mockResponse } = require('../utils/testUtils');

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  auth: () => ({
    verifyIdToken: jest.fn().mockImplementation((token) => {
      if (token === 'valid-token') {
        return Promise.resolve({
          uid: 'test-uid',
          email: 'test@example.com'
        });
      }
      throw new Error('Invalid token');
    })
  })
}));

describe('Auth Middleware', () => {
  const mockNext = jest.fn();

  beforeEach(() => {
    mockNext.mockClear();
  });

  it('should authenticate valid token', async () => {
    const req = mockRequest({
      headers: {
        authorization: 'Bearer valid-token'
      }
    });
    const res = mockResponse();

    await auth(req, res, mockNext);

    expect(req.user).toBeDefined();
    expect(req.user.uid).toBe('test-uid');
    expect(req.user.email).toBe('test@example.com');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject request without token', async () => {
    const req = mockRequest();
    const res = mockResponse();

    await auth(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No authentication token provided'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject invalid token', async () => {
    const req = mockRequest({
      headers: {
        authorization: 'Bearer invalid-token'
      }
    });
    const res = mockResponse();

    await auth(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid authentication token'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
