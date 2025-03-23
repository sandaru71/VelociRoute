import { Platform } from 'react-native';

const LOCAL_IP = '10.235.240.196'; // Update this with your computer's IP

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return __DEV__ ? 'http://10.235.240.196:3000' : `http://${LOCAL_IP}:3000`;
  }
  return __DEV__ ? 'http://localhost:3000' : `http://${LOCAL_IP}:3000`;
};

const getMlServiceUrl = () => {
  if (Platform.OS === 'android') {
    return __DEV__ ? 'http://10.235.240.196:8000' : `http://${LOCAL_IP}:8000`;
  }
  return __DEV__ ? 'http://localhost:8000' : `http://${LOCAL_IP}:8000`;
};

export const API_URL = getApiUrl();
export const ML_SERVICE_URL = getMlServiceUrl();

export default {
  API_URL,
  ML_SERVICE_URL,
};
