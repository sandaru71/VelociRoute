import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// You'll need to replace these with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTxC8RDOO4V5QjDjK6WhhDJHjRHcbB6c0",
  authDomain: "velociroute-sdgp-1e385.firebaseapp.com",
  projectId: "velociroute-sdgp-1e385",
  storageBucket: "velociroute-sdgp-1e385.firebasestorage.app",
  messagingSenderId: "525855705120",
  appId: "1:525855705120:web:fbbf58d0d3ccf43122d445",
  measurementId: "G-46FZ36WCYQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;