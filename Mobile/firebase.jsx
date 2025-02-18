// Import necessary Firebase modules from the modular SDK
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB70SEnlKvZrfAgjdANiGxd6wVt2_dmroU",
  authDomain: "velociroute-sdgp.firebaseapp.com",
  projectId: "velociroute-sdgp",
  storageBucket: "velociroute-sdgp.firebasestorage.app",
  messagingSenderId: "206897972067",
  appId: "1:206897972067:web:90b8e56711d0b31b16c956"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

export { auth };
