import * as admin from "firebase-admin";
admin.initializeApp();

import { createLink } from "./api/create-link";
import { getLink } from "./api/get-link";
import { createPolarCheckout } from "./api/polar/create-checkout";
import { onRequest } from "firebase-functions/v2/https";
import { db } from "./lib/db";
import { polarWebhookHandler } from "./api/polar/webhook-handler";

export { createLink, getLink, createPolarCheckout };

export const polarWebhook = onRequest(
  { cors: true, region: ["us-central1"] },
  async (req, res) => {
    await polarWebhookHandler(req as any, res as any, db);
  },
);
