import { apiClient } from '../../../app/infrastructure/api/apiClient';

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('request handling', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = { data: 'test' };
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await apiClient.get('/test');
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should make POST request with JSON body', async () => {
      const mockData = { test: 'data' };
      const mockResponse = { id: 1, ...mockData };
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await apiClient.post('/test', mockData);
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(mockData)
        })
      );
    });

    it('should handle network errors', async () => {
      const errorMessage = 'Network error';
      global.fetch = jest.fn(() =>
        Promise.reject(new Error(errorMessage))
      );

      await expect(apiClient.get('/test')).rejects.toThrow(errorMessage);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: 'Server Error'
      };
      global.fetch = jest.fn(() => Promise.resolve(errorResponse));

      await expect(apiClient.get('/test')).rejects.toThrow('HTTP error! status: 500 Server Error');
    });
  });

  describe('authentication', () => {
    it('should include auth token in requests', async () => {
      const token = 'test-token';
      apiClient.setAuthToken(token);

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      );

      await apiClient.get('/test');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`
          })
        })
      );
    });

    it('should handle token refresh', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';
      apiClient.setAuthToken(oldToken);

      // First call returns 401
      global.fetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 401
        }))
        // Token refresh call
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: newToken })
        }))
        // Retry original request
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'success' })
        }));

      const result = await apiClient.get('/test');
      expect(result).toEqual({ data: 'success' });
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
});
