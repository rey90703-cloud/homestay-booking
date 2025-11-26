const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: In production, use a service account key file
// For development, Firebase Admin will use Application Default Credentials
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'homestaybooking-56687'
});

module.exports = admin;
