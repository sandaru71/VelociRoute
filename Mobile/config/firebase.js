import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  // Add your Firebase config here from the Firebase Console
  apiKey: "AIzaSyAhSJ1H-oPyhV3n2a0oJFqro8ITZecn7Ro",
  authDomain: "velociroute-ed68f.firebaseapp.com",
  projectId: "velociroute-ed68f",
  storageBucket: "velociroute-ed68f.firebasestorage.app",
  messagingSenderId: "684138177175",
  appId: "1:684138177175:web:fc3abbc0e6215705eb7fd2",
  measurementId: "G-DX86VWRLHL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };