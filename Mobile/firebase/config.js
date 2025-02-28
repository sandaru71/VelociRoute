import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// You'll need to replace these with your Firebase project configuration
const firebaseConfig = {
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
export const auth = getAuth(app);

export default app;