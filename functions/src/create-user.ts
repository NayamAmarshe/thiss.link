import { Firestore, Timestamp } from "firebase-admin/firestore";
import { UserDocument } from "../../types/documents";
import { UserRecord } from "firebase-functions/v1/auth";
import * as logger from "firebase-functions/logger";

export const createUserHandler = async (user: UserRecord, db: Firestore) => {
  try {
    if (!user?.uid) {
      return;
    }

    const userDoc = await db.collection("users").doc(user.uid).get();

    if (userDoc.exists) {
      return;
    }

    await db
      .collection("users")
      .doc(user.uid)
      .set({
        createdAt: Timestamp.fromDate(new Date()),
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
      } as UserDocument);

    logger.info(`User ${user.uid} created successfully`, {
      structuredData: true,
    });
  } catch (error) {
    logger.error("Error saving user", error, {
      structuredData: true,
    });
  }
};
