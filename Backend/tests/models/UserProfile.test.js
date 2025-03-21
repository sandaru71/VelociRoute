const UserProfile = require('../../src/Infrastructure/Models/UserProfile');

describe('UserProfile Model', () => {
  it('should create a valid user profile', () => {
    const validProfileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com',
      bio: 'Cycling enthusiast',
      preferredActivities: ['cycling', 'running'],
      profileImage: 'profile.jpg',
      totalDistance: 150.5,
      totalActivities: 10
    };

    const profile = new UserProfile(validProfileData);
    const validationError = profile.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should require userId', () => {
    const invalidProfileData = {
      displayName: 'John Doe',
      email: 'john@example.com'
    };

    const profile = new UserProfile(invalidProfileData);
    const validationError = profile.validateSync();
    expect(validationError.errors.userId).toBeDefined();
  });

  it('should require displayName', () => {
    const invalidProfileData = {
      userId: '123',
      email: 'john@example.com'
    };

    const profile = new UserProfile(invalidProfileData);
    const validationError = profile.validateSync();
    expect(validationError.errors.displayName).toBeDefined();
  });

  it('should validate email format', () => {
    const invalidProfileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'invalid-email'
    };

    const profile = new UserProfile(invalidProfileData);
    const validationError = profile.validateSync();
    expect(validationError.errors.email).toBeDefined();
  });

  it('should set default values', () => {
    const minimalProfileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com'
    };

    const profile = new UserProfile(minimalProfileData);
    expect(profile.preferredActivities).toEqual([]);
    expect(profile.totalDistance).toBe(0);
    expect(profile.totalActivities).toBe(0);
    expect(profile.createdAt).toBeInstanceOf(Date);
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });

  it('should validate preferred activities', () => {
    const invalidProfileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com',
      preferredActivities: ['invalid_activity']
    };

    const profile = new UserProfile(invalidProfileData);
    const validationError = profile.validateSync();
    expect(validationError.errors['preferredActivities.0']).toBeDefined();
  });

  it('should not allow negative total distance', () => {
    const invalidProfileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com',
      totalDistance: -10
    };

    const profile = new UserProfile(invalidProfileData);
    const validationError = profile.validateSync();
    expect(validationError.errors.totalDistance).toBeDefined();
  });
});
