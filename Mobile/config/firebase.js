import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  // Your existing Firebase config
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

<<<<<<< HEAD
export { auth, app };
=======
export { auth, app };
>>>>>>> aa76488378aec3ebb412a498a64b6277dd21aee3
