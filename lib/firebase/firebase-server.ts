// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { initializeServerApp } from "firebase/app";

import { connectAuthEmulator, getAuth } from "firebase/auth";
import { firebaseConfig } from "./config";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

export async function getAuthenticatedAppForUser() {
  const headers = require("next/headers").headers();
  const idToken = headers().get("Authorization")?.split("Bearer ")[1];

  const firebaseServerApp = initializeServerApp(
    firebaseConfig,
    idToken
      ? {
          authIdToken: idToken,
        }
      : {},
  );

  const auth = getAuth(firebaseServerApp);
  await auth.authStateReady();
  const db = getFirestore(firebaseServerApp);

  if (process.env.NODE_ENV == "development") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }

  return {
    firebaseServerApp,
    currentUser: auth.currentUser,
    serverAuth: auth,
    serverDb: db,
  };
}
