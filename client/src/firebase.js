import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCDKBduHkCwe5ybirE6gcBAqTn_UIqjuOU",
  authDomain: "civic-pulse-b1db8.firebaseapp.com",
  projectId: "civic-pulse-b1db8",
  storageBucket: "civic-pulse-b1db8.firebasestorage.app",
  messagingSenderId: "1094024518764",
  appId: "1:1094024518764:web:6f6b890848dc99a9b28c49",
  measurementId: "G-55Y3Z0WB5B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export let analytics = null;
isSupported().then(yes => {
  if (yes) analytics = getAnalytics(app);
}).catch(console.error);

// Persist login across tabs + refreshes
setPersistence(auth, browserLocalPersistence).catch(console.error);
