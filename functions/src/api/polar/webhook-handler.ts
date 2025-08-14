import { Request } from "firebase-functions/https";
import { logger, Response } from "firebase-functions/v1";
import { Firestore, Timestamp } from "firebase-admin/firestore";
import crypto from "crypto";
import { UserDocument } from "../../../../types/documents";

type PolarEvent = {
  type: string;
  data: any;
};

const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET || "";

/**
 * Verifies the signature of a Polar webhook request using HMAC-SHA256.
 *
 * @param rawBody - The raw request body as a string
 * @param signatureHeader - The signature header from the webhook request
 * @returns True if the signature is valid, false otherwise
 */
function verifySignature(rawBody: string, signatureHeader?: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  if (!signatureHeader) return false;
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(rawBody, "utf8");
  const digest = hmac.digest("hex");
  return signatureHeader === digest;
}

export const polarWebhookHandler = async (
  request: Request,
  response: Response,
  db: Firestore,
) => {
  try {
    // Polar sends JSON; we need the raw string for signature verification.
    const rawBody = JSON.stringify(request.body || {});
    const signature = (request.headers["polar-signature"] ||
      request.headers["Polar-Signature"]) as string | undefined;
    if (!verifySignature(rawBody, signature)) {
      logger.error("Invalid Polar webhook signature");
      return response.sendStatus(400);
    }

    const event = (request.body || {}) as PolarEvent;
    const eventType = event.type || "";
    const now = new Date();

    logger.info("Polar webhook:", {
      eventType,
      dataKeys: Object.keys(event.data || {}),
    });

    // Attempt to resolve user id from event payload
    const userId: string | undefined =
      event?.data?.subscription?.external_customer_id ||
      event?.data?.external_customer_id ||
      event?.data?.metadata?.userId ||
      event?.data?.customer_id ||
      undefined;

    if (!userId) {
      logger.warn("Polar webhook without resolvable userId", { eventType });
      return response.sendStatus(200);
    }

    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      logger.warn("User not found for webhook", { userId, eventType });
      return response.sendStatus(200);
    }

    const subscriptionId: string | undefined =
      event?.data?.subscription?.id || event?.data?.id;
    const planId: string | undefined =
      event?.data?.product_id || event?.data?.subscription?.product_id;

    switch (eventType) {
      case "subscription.created":
      case "subscription.activated":
      case "subscription.renewed": {
        await userRef.update({
          subscription: {
            subscriptionId: subscriptionId || "",
            status: "ACTIVE",
            planDuration: "monthly",
            startPaymentTime: Timestamp.fromDate(now),
            lastPaymentTime: Timestamp.fromDate(now),
            nextPaymentTime: null,
            planId: planId || "",
          },
          isSubscribed: true,
          updatedAt: Timestamp.fromDate(now),
        } as Partial<UserDocument>);
        break;
      }
      case "subscription.canceled":
      case "subscription.expired":
      case "subscription.revoked": {
        const existing = userSnap.data() as UserDocument;
        // archive previous state
        if (subscriptionId) {
          await db.doc(`users/${userId}/paymentHistory/${subscriptionId}`).set({
            ...existing.subscription,
            subscriptionId,
            updatedAt: Timestamp.fromDate(now),
          });
        }

        await userRef.update({
          isSubscribed: false,
          subscription: existing.subscription
            ? { ...existing.subscription, status: "INACTIVE" }
            : undefined,
          updatedAt: Timestamp.fromDate(now),
        } as Partial<UserDocument>);
        break;
      }
      default: {
        // Ignore unrelated events
        break;
      }
    }

    return response.sendStatus(200);
  } catch (error) {
    logger.error("Error handling Polar webhook", error);
    return response.sendStatus(400);
  }
};
