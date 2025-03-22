import { NativeModules as RNNativeModules } from 'react-native';

// Mock the RNCNetInfo module
RNNativeModules.RNCNetInfo = {
  getCurrentState: jest.fn(() => Promise.resolve()),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 40.7128,
      longitude: -74.0060
    }
  })),
  watchPositionAsync: jest.fn(() => ({
    remove: jest.fn()
  }))
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: class MockMapView extends React.Component {
      render() {
        return React.createElement('MockMapView', this.props, this.props.children);
      }
    },
    Marker: class MockMarker extends React.Component {
      render() {
        return React.createElement('MockMarker', this.props, this.props.children);
      }
    },
    Polyline: class MockPolyline extends React.Component {
      render() {
        return React.createElement('MockPolyline', this.props, this.props.children);
      }
    }
  };
});
