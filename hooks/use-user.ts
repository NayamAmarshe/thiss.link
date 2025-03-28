import { onSnapshot, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  User,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  ErrorFn,
  NextOrObserver,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { UserDocument } from "@/types/documents";
import { functions } from "@/lib/firebase/firebase";
import { httpsCallable } from "firebase/functions";

/**
 * Custom hook for managing user data and tasks.
 * @returns An object containing user-related data and functions.
 */
const useUser = () => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  const handleLogin = async () => {
    setUserLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const createUserFunction = httpsCallable(functions, "createUser");

      try {
        const result = await createUserFunction({
          user: userCredential.user,
        });

        const responseData = result.data as { status: string; message: string };
        if (responseData.status === "error") {
          throw new Error(responseData.message);
        }
      } catch (error) {
        if (error instanceof Error) {
          throw new Error("Failed to create user: " + error.message);
        }
        throw new Error("Failed to create user");
      }
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setUserLoading(false);
    }
  };

  function onAuthStateChanged(
    callback: NextOrObserver<User>,
    errorCallback?: ErrorFn,
  ) {
    return _onAuthStateChanged(auth, callback, errorCallback);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (user) {
        setLoggedIn(true);
        setUser(user);
      }
      setUserLoading(false);
    }, setError);

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, `users/${user?.uid}`);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userDocData = doc.data() as UserDocument;
        if (!userDocData) {
          console.error("User document data is missing");
          return;
        }
        setUserDocument(userDocData);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  return {
    /**
     * User object from Firebase Auth
     * @type {User | null | undefined}
     */
    user,
    /**
     * The user document object from Firestore
     */
    userDocument,
    /**
     * Any error that occurred
     */
    error,
    isLoggedIn,
    userLoading,
    setUserLoading,
    handleLogin,
  };
};

export default useUser;
