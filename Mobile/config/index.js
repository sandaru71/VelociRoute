// import { Platform } from 'react-native';

// // Configuration variables
// const get = () => {
//   if (Platform.OS === 'android') {
//     // Android Emulator
//     return 'http://10.0.2.2:3000';
//   } else if (Platform.OS === 'ios') {
//     // iOS Simulator
//     return 'http://localhost:3000';
//   } else {
//     // Local Network Development (physical device)
//     return 'http://10.197.231.196:3000';
//   }
// };


// export const API_URL = get();

export const API_URL = 'http://192.168.8.105:3000'; //android emulator
// export const API_URL = 'http://localhost:3000'; //ios emulator
// export const API_URL = 'http://10.54.219.97:3000'; //local network

export default {
  API_URL,
};
