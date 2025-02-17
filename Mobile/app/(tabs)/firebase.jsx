// Import the functions you need from the SDKs you need
import * as firebase from "firebase";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
let app;
if (firebase.apps.length===0){
 app = firebase.initializeApp(firebaseConfig);
}
else{
  app = firebase.app()
}
const auth = firebase.auth()
export{auth};