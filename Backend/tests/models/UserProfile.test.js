const mongoose = require('mongoose');
const { setupTestDB, closeTestDB } = require('../utils/testUtils');
const UserProfile = require('../../src/Infrastructure/Models/UserProfile');

describe('UserProfile Model', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('should create a valid user profile', () => {
    const validProfileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com',
      bio: 'Cycling enthusiast',
      preferredActivities: ['cycling', 'running'],
      profileImage: 'profile.jpg',
      totalDistance: 100,
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

  it('should require email', () => {
    const invalidProfileData = {
      userId: '123',
      displayName: 'John Doe'
    };

    const profile = new UserProfile(invalidProfileData);
    const validationError = profile.validateSync();
    expect(validationError.errors.email).toBeDefined();
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

  it('should validate preferredActivities enum', () => {
    const invalidProfileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com',
      preferredActivities: ['invalid']
    };

    const profile = new UserProfile(invalidProfileData);
    const validationError = profile.validateSync();
    expect(validationError.errors['preferredActivities.0']).toBeDefined();
  });

  it('should default totalDistance and totalActivities to 0', () => {
    const profileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com'
    };

    const profile = new UserProfile(profileData);
    expect(profile.totalDistance).toBe(0);
    expect(profile.totalActivities).toBe(0);
  });

  it('should validate minimum totalDistance', () => {
    const invalidProfileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com',
      totalDistance: -1
    };

    const profile = new UserProfile(invalidProfileData);
    const validationError = profile.validateSync();
    expect(validationError.errors.totalDistance).toBeDefined();
  });

  it('should validate minimum totalActivities', () => {
    const invalidProfileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com',
      totalActivities: -1
    };

    const profile = new UserProfile(invalidProfileData);
    const validationError = profile.validateSync();
    expect(validationError.errors.totalActivities).toBeDefined();
  });

  it('should save profile to database', async () => {
    const validProfileData = {
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com',
      bio: 'Cycling enthusiast',
      preferredActivities: ['cycling', 'running'],
      profileImage: 'profile.jpg',
      totalDistance: 100,
      totalActivities: 10
    };

    const profile = new UserProfile(validProfileData);
    const savedProfile = await profile.save();
    
    expect(savedProfile._id).toBeDefined();
    expect(savedProfile.userId).toBe(validProfileData.userId);
    expect(savedProfile.displayName).toBe(validProfileData.displayName);
    expect(savedProfile.email).toBe(validProfileData.email);
    expect(savedProfile.preferredActivities).toEqual(validProfileData.preferredActivities);
    expect(savedProfile.createdAt).toBeDefined();
    expect(savedProfile.updatedAt).toBeDefined();
  });
});
