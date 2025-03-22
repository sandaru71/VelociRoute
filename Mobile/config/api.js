import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the appropriate API URL based on the platform and environment
const getApiUrl = () => {
    // First check for environment variable
    const envUrl = Constants.expoConfig?.extra?.API_URL;
    if (envUrl) {
        console.log('Using environment API URL:', envUrl);
        return envUrl;
    }

    // Otherwise use platform-specific defaults
    let apiUrl;
    if (Platform.OS === 'android') {
        // Android Emulator uses 10.0.2.2 to access host machine's localhost
        apiUrl = 'http://10.235.240.40:3000';
    } else if (Platform.OS === 'ios') {
        // iOS Simulator can use localhost directly
        apiUrl = 'http://localhost:3000';
    } else {
        // For local network development or testing on physical devices
        apiUrl = 'http://10.235.240.196:3000';
    }
    
    console.log('Using platform-specific API URL:', apiUrl);
    return apiUrl;
};

// Export the API URL
const API_URL = getApiUrl();
console.log('Exported API_URL:', API_URL);

export { API_URL };

// Export Cloudinary configuration
export const CLOUDINARY_CONFIG = {
    cloud_name: Constants.expoConfig?.extra?.CLOUDINARY_CLOUD_NAME || 'dq1hjlghb',
    upload_preset: Constants.expoConfig?.extra?.CLOUDINARY_UPLOAD_PRESET || 'ml_default',
    api_key: Constants.expoConfig?.extra?.CLOUDINARY_API_KEY
};
