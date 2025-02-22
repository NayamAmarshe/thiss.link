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
import { createUserHandler } from "./handlers/create-user";
import { getLinkHandler } from "./handlers/get-link";
import { verifySubscriptionHandler } from "./handlers/verify-subscription";
import { createLinkHandler } from "./handlers/create-link";

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
  async (request, response) => {
    logger.info("createLink called!", { structuredData: true });
    await createLinkHandler(request, response, db);
  },
);

export const createUser = functions.auth.user().onCreate(async (user) => {
  logger.info("createUser called!", { structuredData: true });
  await createUserHandler(user, db);
});

export const getLink = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    region: ["us-central1"],
  },
  async (request, response) => {
    logger.info("getLink called!", { structuredData: true });
    await getLinkHandler(request, response, db);
  },
);

export const verifySubscription = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    region: ["us-central1"],
  },
  async (req, res) => {
    console.log("verifySubscription called!");
    await verifySubscriptionHandler(req, res, db);
  },
);
