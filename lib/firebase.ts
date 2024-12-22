import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Add emulator connection before initialization
if (process.env.NODE_ENV === "development") {
  try {
    // Check if we're not already connected to the emulator
    const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR;

    if (useEmulator && !global.firestoreEmulatorInitialized) {
      connectFirestoreEmulator(db, "localhost", 8080);
      connectAuthEmulator(auth, "http://localhost:9099");
      global.firestoreEmulatorInitialized = true;
    }
  } catch (error) {
    console.error("Error connecting to emulators:", error);
  }
}

export { auth, db };
export default firebaseApp;
