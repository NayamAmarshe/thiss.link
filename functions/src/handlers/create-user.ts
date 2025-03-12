import * as functions from "firebase-functions/v1";
import { Timestamp } from "firebase-admin/firestore";
import { UserDocument } from "../../../types/documents";
import { HttpsError } from "firebase-functions/v1/auth";
import * as logger from "firebase-functions/logger";
import { db } from "../lib/db";

export const createUser = functions.auth.user().onCreate(async (user) => {
  logger.info("createUser called!", { structuredData: true });
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
        customLinksUsage: {
          count: 0,
          monthlyReset: Timestamp.fromDate(new Date()),
        },
      } as UserDocument);

    logger.info(`User ${user.uid} created successfully`, {
      structuredData: true,
    });
  } catch (error) {
    logger.error("Error saving user", error, {
      structuredData: true,
    });
    throw new HttpsError("internal", "Error saving user");
  }
});
