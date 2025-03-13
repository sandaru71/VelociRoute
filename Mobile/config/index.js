// Configuration variables
export const API_URL = 'http://192.168.8.112:3000'; // Use the network IP shown in server logs
// export const API_URL = 'http://localhost:3000'; // iOS simulator
// export const API_URL = 'http://10.31.38.129:3002';

export const getApiEndpoint = (path) => `${API_URL}/api/${path}`;

export default {
  API_URL,
  getApiEndpoint,
};
