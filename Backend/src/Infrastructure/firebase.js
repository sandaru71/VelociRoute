const admin = require('firebase-admin');

// Initialize Firebase Admin with service account
const serviceAccount = require('../../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
