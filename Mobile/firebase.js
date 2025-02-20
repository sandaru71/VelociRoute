// Import the functions you need from the SDKs
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDw8THdsPpcK67x9YOuNCPoJfCDnwuI1Mw",
  authDomain: "velociroute-4e6a8.firebaseapp.com",
  projectId: "velociroute-4e6a8",
  storageBucket: "velociroute-4e6a8.appspot.com", // Fixed incorrect storage bucket URL
  messagingSenderId: "809760547860",
  appId: "1:809760547860:web:65ad36653556582155f301",
};

let firebaseApp = null;

// Function to initialize Firebase
export const getFirebaseApp = () => {
  if (!firebaseApp) {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    // Initialize Firebase Authentication with Async Storage
    initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  }
  return firebaseApp;
};

// Export Firebase Authentication instance
export const auth = getAuth(getFirebaseApp());
