import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the appropriate API URL based on the platform and environment
const getApiUrl = () => {
    // First check for environment variable
    const envUrl = Constants.expoConfig?.extra?.API_URL;
    if (envUrl) {
        return envUrl;
    }

    // Otherwise use platform-specific defaults
    if (Platform.OS === 'android') {
        // Android Emulator uses 10.0.2.2 to access host machine's localhost
        return 'http://10.0.2.2:3000';
    } else if (Platform.OS === 'ios') {
        // iOS Simulator can use localhost directly
        return 'http://localhost:3000';
    } else {
        // For local network development or testing on physical devices
        // Using the current local IP from our memory
        return 'http://192.168.18.4:3000';
    }
};

// Export the API URL
export const API_URL = getApiUrl();

// Export Cloudinary configuration
export const CLOUDINARY_CONFIG = {
    cloud_name: Constants.expoConfig?.extra?.CLOUDINARY_CLOUD_NAME || 'dq1hjlghb',
    upload_preset: Constants.expoConfig?.extra?.CLOUDINARY_UPLOAD_PRESET || 'ml_default',
    api_key: Constants.expoConfig?.extra?.CLOUDINARY_API_KEY
};
