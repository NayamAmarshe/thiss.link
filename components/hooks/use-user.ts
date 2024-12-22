import { onSnapshot, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { UserDocument } from "@/types/documents";
import { createUser } from "@/lib/actions/create-user";

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
      const createUserResponse = await createUser({
        user: userCredential.user,
      });
      if (createUserResponse.status === "error") {
        throw new Error(createUserResponse.message);
      }
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    const listener = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          setLoggedIn(true);
          setUser(user);
        }
        setUserLoading(false);
      },
      setError,
    );
    return () => {
      listener();
    };
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
