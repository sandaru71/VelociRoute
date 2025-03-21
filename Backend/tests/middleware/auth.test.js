const admin = require('firebase-admin');

// Mock firebase-admin before requiring the middleware
jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn()
  }))
}));

// Import middleware after mocking firebase-admin
const { authMiddleware } = require('../../src/Infrastructure/Middleware/auth');

describe('Authentication Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    mockReq = {
      headers: {
        authorization: 'Bearer test-token'
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should authenticate valid token', async () => {
    const mockDecodedToken = {
      uid: 'test-user-id',
      email: 'test@example.com'
    };

    admin.auth().verifyIdToken.mockResolvedValueOnce(mockDecodedToken);

    await authMiddleware(mockReq, mockRes, nextFunction);

    expect(admin.auth().verifyIdToken).toHaveBeenCalledWith('test-token');
    expect(mockReq.user).toEqual(mockDecodedToken);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should reject request with no authorization header', async () => {
    mockReq.headers = {};

    await authMiddleware(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'No authorization token provided'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject invalid authorization format', async () => {
    mockReq.headers.authorization = 'InvalidFormat test-token';

    await authMiddleware(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Invalid authorization format'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle invalid tokens', async () => {
    admin.auth().verifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

    await authMiddleware(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Invalid token'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle firebase admin errors', async () => {
    const firebaseError = new Error('Firebase error');
    firebaseError.code = 'auth/id-token-expired';
    admin.auth().verifyIdToken.mockRejectedValueOnce(firebaseError);

    await authMiddleware(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Authentication failed'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
