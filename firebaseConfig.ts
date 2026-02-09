import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAYKVLvd-PW33uynlVr_CIcHphWBBBpg9o",
  authDomain: "storagemanager-69c10.firebaseapp.com",
  databaseURL: "https://storagemanager-69c10-default-rtdb.firebaseio.com",
  projectId: "storagemanager-69c10",
  // Use the default Cloud Storage bucket hostname (appspot.com)
  // The previous value caused malformed requests/CORS failures in the browser.
  storageBucket: "storagemanager-69c10.appspot.com",
  messagingSenderId: "107765379974",
  appId: "1:107765379974:web:d1e2100cc6c8f6daf83207"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
