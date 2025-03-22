import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBKRFELzWxWpzNSXIVYFnPXKYEZVbhXKKE",
  authDomain: "velociroute-v4.firebaseapp.com",
  projectId: "velociroute-v4",
  storageBucket: "velociroute-v4.appspot.com",
  messagingSenderId: "1011936334027",
  appId: "1:1011936334027:web:e3d2c7d2a3c4e7c7c3c4e7"
};

let app;
let auth;

// Add error handling for initialization
try {
  if (getApps().length === 0) {
    console.log('Initializing new Firebase app...');
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Firebase app initialized successfully');
  } else {
    console.log('Using existing Firebase app...');
    app = getApp();
    auth = getAuth(app);
    console.log('Got existing Firebase auth instance');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { auth, app };
