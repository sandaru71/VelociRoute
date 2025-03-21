const cloudinary = require('cloudinary').v2;

describe('Cloudinary Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should configure cloudinary with environment variables', () => {
    // Set test environment variables
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';

    // Re-require the module to test configuration
    require('../../src/Infrastructure/cloudinary');

    expect(cloudinary.config().cloud_name).toBe('test-cloud');
    expect(cloudinary.config().api_key).toBe('test-key');
    expect(cloudinary.config().api_secret).toBe('test-secret');
  });

  it('should handle missing environment variables', () => {
    // Clear environment variables
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    expect(() => {
      require('../../src/Infrastructure/cloudinary');
    }).toThrow();
  });
});
