/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { createLinkHandler } from "./create-link";
import { createUserHandler } from "./create-user";
import { getLinkHandler } from "./get-link";

admin.initializeApp();
const db = admin.firestore();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const createLink = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    region: ["us-central1"],
  },
  (request, response) => {
    logger.info("createLink called!", { structuredData: true });
    return createLinkHandler(request, response, db);
  },
);

export const createUser = functions.auth.user().onCreate(async (user) => {
  logger.info("createUser called!", { structuredData: true });
  await createUserHandler(user, db);
});

export const getLink = functions.https.onRequest(async (req, res) => {
  await getLinkHandler(req, res, db);
});
