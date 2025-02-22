// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDw8THdsPpcK67x9YOuNCPoJfCDnwuI1Mw",
  authDomain: "velociroute-4e6a8.firebaseapp.com",
  databaseURL: "https://velociroute-4e6a8-default-rtdb.firebaseio.com",
  projectId: "velociroute-4e6a8",
  storageBucket: "velociroute-4e6a8.appspot.com",
  messagingSenderId: "809760547860",
  appId: "1:809760547860:web:65ad36653556582155f301"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { auth };