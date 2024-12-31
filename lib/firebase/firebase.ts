import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { firebaseConfig } from "./config";

const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

if (process.env.NODE_ENV == "development") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export { auth, db };
