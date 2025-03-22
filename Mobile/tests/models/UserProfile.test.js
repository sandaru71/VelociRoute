import { UserProfile } from '../../app/models/UserProfile';

describe('UserProfile Model', () => {
  describe('validation', () => {
    it('should create a valid user profile', () => {
      const profileData = {
        userId: '123',
        displayName: 'John Doe',
        email: 'john@example.com',
        bio: 'Cycling enthusiast',
        preferredActivities: ['cycling', 'running'],
        totalDistance: 100,
        totalActivities: 10
      };

      const profile = new UserProfile(profileData);
      expect(profile).toMatchObject(profileData);
    });

    it('should validate required fields', () => {
      const profile = new UserProfile({});
      expect(() => profile.validate()).toThrow();
    });

    it('should validate email format', () => {
      const profile = new UserProfile({
        userId: '123',
        displayName: 'John',
        email: 'invalid-email'
      });
      expect(() => profile.validate()).toThrow('Invalid email format');
    });

    it('should validate preferred activities', () => {
      const profile = new UserProfile({
        userId: '123',
        displayName: 'John',
        email: 'john@example.com',
        preferredActivities: ['invalid']
      });
      expect(() => profile.validate()).toThrow('Invalid activity type');
    });
  });

  describe('stats', () => {
    it('should update total distance', () => {
      const profile = new UserProfile({
        userId: '123',
        displayName: 'John',
        email: 'john@example.com',
        totalDistance: 100
      });

      profile.updateTotalDistance(50);
      expect(profile.totalDistance).toBe(150);
    });

    it('should update total activities', () => {
      const profile = new UserProfile({
        userId: '123',
        displayName: 'John',
        email: 'john@example.com',
        totalActivities: 10
      });

      profile.incrementTotalActivities();
      expect(profile.totalActivities).toBe(11);
    });
  });
});
