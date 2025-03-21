const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

function initializeFirebase() {
    if (!firebaseApp) {
        // Initialize Firebase Admin with service account
        const serviceAccount = require('../../firebase-service-account.json');
        
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        }, 'velociroute-app'); // Give it a unique name
    }
    return firebaseApp;
}

// Export the initialized app
module.exports = {
    admin,
    getFirebaseApp: initializeFirebase
};
