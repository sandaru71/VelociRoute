import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '../../app/navigation/AppNavigator';
import { authMiddleware } from '../../app/middleware/authMiddleware';

jest.mock('../../app/middleware/authMiddleware', () => ({
  authMiddleware: {
    isAuthenticated: jest.fn(),
    addAuthStateListener: jest.fn()
  }
}));

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render auth stack when not authenticated', () => {
    authMiddleware.isAuthenticated.mockReturnValue(false);

    const { getByTestId } = render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );

    expect(getByTestId('auth-stack')).toBeTruthy();
  });

  it('should render main stack when authenticated', () => {
    authMiddleware.isAuthenticated.mockReturnValue(true);

    const { getByTestId } = render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );

    expect(getByTestId('main-stack')).toBeTruthy();
  });

  it('should listen for auth state changes', () => {
    render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );

    expect(authMiddleware.addAuthStateListener).toHaveBeenCalled();
  });

  describe('navigation behavior', () => {
    it('should navigate to login screen by default in auth stack', () => {
      authMiddleware.isAuthenticated.mockReturnValue(false);

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      expect(getByTestId('login-screen')).toBeTruthy();
    });

    it('should navigate to dashboard screen by default in main stack', () => {
      authMiddleware.isAuthenticated.mockReturnValue(true);

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      expect(getByTestId('dashboard-screen')).toBeTruthy();
    });

    it('should handle tab navigation', () => {
      authMiddleware.isAuthenticated.mockReturnValue(true);

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      fireEvent.press(getByTestId('profile-tab'));
      expect(getByTestId('profile-screen')).toBeTruthy();

      fireEvent.press(getByTestId('activities-tab'));
      expect(getByTestId('activities-screen')).toBeTruthy();
    });

    it('should handle stack navigation', () => {
      authMiddleware.isAuthenticated.mockReturnValue(true);

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      fireEvent.press(getByTestId('new-activity-button'));
      expect(getByTestId('record-activity-screen')).toBeTruthy();
    });
  });

  describe('deep linking', () => {
    it('should handle activity deep links', () => {
      authMiddleware.isAuthenticated.mockReturnValue(true);

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      // Simulate deep link to activity
      fireEvent(NavigationContainer, 'onNavigationStateChange', {
        routes: [
          { name: 'Activity', params: { activityId: '123' } }
        ]
      });

      expect(getByTestId('activity-details-screen')).toBeTruthy();
    });

    it('should handle profile deep links', () => {
      authMiddleware.isAuthenticated.mockReturnValue(true);

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      // Simulate deep link to profile
      fireEvent(NavigationContainer, 'onNavigationStateChange', {
        routes: [
          { name: 'Profile', params: { userId: '123' } }
        ]
      });

      expect(getByTestId('profile-screen')).toBeTruthy();
    });
  });
});
