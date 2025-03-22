import { renderWithProviders, mockFetchResponse } from '../utils/testUtils';
import { getProfile, updateProfile } from '../../app/controllers/userProfileController';

describe('UserProfileController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    const mockProfile = {
      id: '1',
      userId: '123',
      displayName: 'John Doe',
      email: 'john@example.com',
      bio: 'Cycling enthusiast',
      preferredActivities: ['cycling', 'running'],
      totalDistance: 100,
      totalActivities: 10
    };

    it('should fetch user profile successfully', async () => {
      mockFetchResponse(mockProfile);

      const userId = '123';
      const profile = await getProfile(userId);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/users/${userId}/profile`,
        expect.any(Object)
      );
      expect(profile).toEqual(mockProfile);
    });

    it('should handle non-existent profile', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })
      );

      await expect(getProfile('nonexistent')).rejects.toThrow('HTTP error! status: 404 Not Found');
    });
  });

  describe('updateProfile', () => {
    const mockProfile = {
      userId: '123',
      displayName: 'John Doe',
      bio: 'Updated bio',
      preferredActivities: ['cycling']
    };

    it('should update profile successfully', async () => {
      const updatedProfile = { ...mockProfile, id: '1' };
      mockFetchResponse(updatedProfile);

      const result = await updateProfile(mockProfile.userId, mockProfile);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/users/${mockProfile.userId}/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockProfile)
        }
      );
      expect(result).toEqual(updatedProfile);
    });

    it('should handle validation errors', async () => {
      const errorMessage = 'Validation failed';
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: errorMessage
        })
      );

      const invalidProfile = { ...mockProfile, email: 'invalid-email' };

      await expect(updateProfile('123', invalidProfile)).rejects.toThrow(`HTTP error! status: 400 ${errorMessage}`);
    });

    it('should handle profile image upload', async () => {
      const profileWithImage = {
        ...mockProfile,
        profileImage: {
          uri: 'file://test.jpg',
          type: 'image/jpeg',
          name: 'test.jpg'
        }
      };

      const updatedProfile = {
        ...profileWithImage,
        id: '1',
        profileImage: 'https://example.com/test.jpg'
      };

      mockFetchResponse(updatedProfile);

      const formData = new FormData();
      Object.entries(mockProfile).forEach(([key, value]) => {
        if (key !== 'profileImage') {
          formData.append(key, value);
        }
      });
      formData.append('profileImage', profileWithImage.profileImage);

      const result = await updateProfile('123', profileWithImage);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/users/123/profile',
        {
          method: 'PUT',
          body: expect.any(FormData)
        }
      );
      expect(result).toEqual(updatedProfile);
    });
  });
});
