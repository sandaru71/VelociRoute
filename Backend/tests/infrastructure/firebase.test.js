const admin = require('firebase-admin');

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  }
}));

describe('Firebase Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should initialize Firebase Admin with service account', () => {
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_PRIVATE_KEY = 'test-key';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@email.com';

    require('../../src/Infrastructure/firebase');

    expect(admin.credential.cert).toHaveBeenCalledWith({
      projectId: 'test-project',
      privateKey: 'test-key',
      clientEmail: 'test@email.com'
    });
    expect(admin.initializeApp).toHaveBeenCalled();
  });

  it('should handle missing environment variables', () => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIREBASE_CLIENT_EMAIL;

    expect(() => {
      require('../../src/Infrastructure/firebase');
    }).toThrow();
  });
});
