import { Platform } from 'react-native';

// Configuration variables
const get = () => {
  if (Platform.OS === 'android') {
    // Android
    return 'http://192.168.8.112:3000';
  } else if (Platform.OS === 'ios') {
    // iOS
    return 'http://192.168.8.112:3000';
  } else {
    // Local Network Development
    return 'http://192.168.8.112:3000';
  }
};

export const API_URL = get();

export default {
  API_URL,
};
