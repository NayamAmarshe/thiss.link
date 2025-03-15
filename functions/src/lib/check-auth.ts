import { auth } from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";
import { Request } from "firebase-functions/https";
import { logger } from "firebase-functions/v1";
import { UserDocument } from "../../../types/documents";

// NOT FOR USERS WITH API KEYS
export const checkAuth = async (request: Request, db?: Firestore) => {
  let authUserId = "";

  const requestBody = request.body as {
    data: {
      userId: string;
    };
  };

  const authorization = request.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    logger.log("Unauthorized Request");
    return {
      status: 403,
      message: "Unauthorized Request",
    };
  }

  // Decode the authorization token
  try {
    const user = await auth().verifyIdToken(authorization.split("Bearer ")[1]);
    // Get the user ID
    authUserId = user.uid;
    if (db) {
      const userRef = db.doc(`users/${user.uid}`);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return {
          status: 404,
          message: "User not found",
        };
      }
      const userData = userDoc.data() as UserDocument;
      if (userData.admin) {
        return {
          status: 200,
          message: "Authorized",
          userId: authUserId,
        };
      }
    }
  } catch (error: any) {
    logger.log("Unauthorized Request: ", error.message);
    return {
      status: 403,
      message: "Unauthorized Request",
    };
  }

  if (!requestBody.data) {
    logger.log("Bad Request");
    return {
      status: 400,
      message: "Bad Request: No Data",
    };
  }

  // Get the user ID from the request
  const userId = requestBody.data.userId;
  logger.log("userId: ", userId);

  // Check if the user ID is empty
  if (!userId) {
    return {
      status: 400,
      message: "Bad Request: Missing User ID",
    };
  }

  // Compare the user ID with the authenticated user ID
  if (userId !== authUserId) {
    return {
      status: 403,
      message: "Unauthorized Request",
    };
  }

  return {
    status: 200,
    message: "Authorized",
    userId,
  };
};
