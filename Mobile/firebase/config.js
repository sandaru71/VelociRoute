import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// You'll need to replace these with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6LmWo1nrykNZR-RQM2kiLWifsW959gGE",
  authDomain: "velociroute-5009e.firebaseapp.com",
  projectId: "velociroute-5009e",
  storageBucket: "velociroute-5009e.firebasestorage.app",
  messagingSenderId: "475210861437",
  appId: "1:475210861437:web:f0dba7fae9f8900737da14",
  measurementId: "G-6KLF2E5HKB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;