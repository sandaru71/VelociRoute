// Import the functions you need from the SDKs you need
import { getApp, getApps,initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "@react-native-firebase/auth";
import ReactNativeAsyncStorage from ""
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDw8THdsPpcK67x9YOuNCPoJfCDnwuI1Mw",
  authDomain: "velociroute-4e6a8.firebaseapp.com",
  projectId: "velociroute-4e6a8",
  storageBucket: "velociroute-4e6a8.firebasestorage.app",
  messagingSenderId: "809760547860",
  appId: "1:809760547860:web:65ad36653556582155f301"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);