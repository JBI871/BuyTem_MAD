const admin = require('firebase-admin');
require('dotenv').config();
const path = require('path');

// Build absolute path to the service account key
const serviceAccountPath = path.resolve(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS);
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = db;
