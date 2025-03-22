import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a wrapper with navigation and query client
export const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </QueryClientProvider>
  );
};

// Helper to render with providers
export const renderWithProviders = (ui, options = {}) => {
  const wrapper = createTestWrapper();
  return render(ui, { wrapper, ...options });
};

// Mock API response data
export const mockRouteData = {
  id: '1',
  name: 'Central Park Loop',
  description: 'A scenic route around Central Park',
  activityType: 'cycling',
  difficulty: 'medium',
  distance: 10.5,
  elevation: 150,
  averageTime: 3600,
  location: 'New York, NY',
  mapUrl: 'https://example.com/map.jpg',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
};

// Mock fetch response
export const mockFetchResponse = (data) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data)
    })
  );
};
