// Firebase Realtime Database Configuration Stub
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Configuration from env variables (the user will provide these keys)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "venueiq.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://venueiq-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "venueiq",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "venueiq.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Only initialize if an API key is provided, else leave it null to gracefully fall back
export const app = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" ? initializeApp(firebaseConfig) : null;
export const db = app ? getDatabase(app) : null;
