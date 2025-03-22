import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, connectAuthEmulator } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

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

const initializeFirebase = async () => {
  try {
    // Check network connectivity first
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection');
    }

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

    // Set up offline persistence
    await auth.setPersistence('local');
    
    return { auth, app };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// Initialize Firebase
initializeFirebase().catch(error => {
  console.error('Failed to initialize Firebase:', error);
});

export { auth, app };
