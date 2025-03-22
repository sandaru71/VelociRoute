import { renderWithProviders, mockRouteData, mockFetchResponse } from '../utils/testUtils';
import { getRoutes, createRoute } from '../../app/controllers/popularRouteController';

describe('PopularRouteController', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getRoutes', () => {
    it('should fetch routes successfully', async () => {
      const mockRoutes = [mockRouteData];
      mockFetchResponse(mockRoutes);

      const routes = await getRoutes();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/routes',
        expect.any(Object)
      );
      expect(routes).toEqual(mockRoutes);
    });

    it('should fetch routes with filters', async () => {
      const mockRoutes = [mockRouteData];
      mockFetchResponse(mockRoutes);

      const filters = {
        activityType: 'cycling',
        difficulty: 'medium',
        minDistance: 5,
        maxDistance: 15,
        location: 'New York'
      };

      const routes = await getRoutes(filters);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/routes?' + new URLSearchParams(filters),
        expect.any(Object)
      );
      expect(routes).toEqual(mockRoutes);
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error';
      global.fetch = jest.fn(() => Promise.reject(new Error(errorMessage)));

      await expect(getRoutes()).rejects.toThrow(errorMessage);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Server error';
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: errorMessage
        })
      );

      await expect(getRoutes()).rejects.toThrow(`HTTP error! status: 500 ${errorMessage}`);
    });
  });

  describe('createRoute', () => {
    const newRoute = {
      name: 'New Route',
      description: 'A new test route',
      activityType: 'cycling',
      difficulty: 'easy',
      distance: 8.0,
      elevation: 100,
      averageTime: 2400,
      location: 'Test Location'
    };

    it('should create a route successfully', async () => {
      const createdRoute = { ...newRoute, id: '2' };
      mockFetchResponse(createdRoute);

      const result = await createRoute(newRoute);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/routes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newRoute)
        }
      );
      expect(result).toEqual(createdRoute);
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

      const invalidRoute = { ...newRoute, activityType: 'invalid' };

      await expect(createRoute(invalidRoute)).rejects.toThrow(`HTTP error! status: 400 ${errorMessage}`);
    });

    it('should handle network errors', async () => {
      const errorMessage = 'Network error';
      global.fetch = jest.fn(() => Promise.reject(new Error(errorMessage)));

      await expect(createRoute(newRoute)).rejects.toThrow(errorMessage);
    });

    it('should upload images with the route', async () => {
      const images = [
        { uri: 'file://test1.jpg', type: 'image/jpeg', name: 'test1.jpg' },
        { uri: 'file://test2.jpg', type: 'image/jpeg', name: 'test2.jpg' }
      ];

      const routeWithImages = { ...newRoute, images };
      const createdRoute = {
        ...routeWithImages,
        id: '2',
        images: ['https://example.com/test1.jpg', 'https://example.com/test2.jpg']
      };

      mockFetchResponse(createdRoute);

      const formData = new FormData();
      Object.entries(newRoute).forEach(([key, value]) => {
        if (key !== 'images') {
          formData.append(key, value);
        }
      });
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      const result = await createRoute(routeWithImages);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/routes',
        {
          method: 'POST',
          body: expect.any(FormData)
        }
      );
      expect(result).toEqual(createdRoute);
    });
  });
});
