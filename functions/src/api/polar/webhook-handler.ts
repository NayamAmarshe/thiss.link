import { Request } from "firebase-functions/https";
import { logger, Response } from "firebase-functions/v1";
import { Firestore, Timestamp } from "firebase-admin/firestore";
import { UserDocument } from "../../../../types/documents";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";

const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET || "";

export const polarWebhookHandler = async (
  request: Request,
  response: Response,
  db: Firestore,
) => {
  try {
    // Polar sends JSON; we need the raw string for signature verification.
    const event = validateEvent(
      request.rawBody,
      request.headers as any,
      WEBHOOK_SECRET,
    );
    console.log("🚀 => polarWebhookHandler => event:", event);

    const eventType = event.type || "";
    const now = new Date();

    logger.info("Polar webhook:", {
      eventType,
      dataKeys: Object.keys(event.data || {}),
    });

    // Attempt to resolve user id from event payload
    const userId: string | undefined = (event.data as any)?.metadata?.userId;

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

    const subscriptionId: string | undefined = (event.data as any)?.subscription
      ?.id;
    const productId: string | undefined = (event.data as any)?.product.id;
    const startPaymentTime: string = (event.data as any)?.currentPeriodStart;
    const lastPaymentTime: string = (event.data as any)?.currentPeriodEnd;
    const nextPaymentTime: string = (event.data as any)?.nextPeriodStart;

    switch (eventType) {
      case "order.created": {
        await userRef.update({
          subscription: {
            subscriptionId: subscriptionId || "",
            status: "active",
            planDuration: "monthly",
            startPaymentTime: Timestamp.fromDate(new Date(startPaymentTime)),
            lastPaymentTime: Timestamp.fromDate(new Date(lastPaymentTime)),
            nextPaymentTime: Timestamp.fromDate(new Date(nextPaymentTime)),
            productId: productId || "",
          },
          isSubscribed: true,
          updatedAt: Timestamp.fromDate(now),
        } as Partial<UserDocument>);
        break;
      }
      case "subscription.canceled":
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
    if (error instanceof WebhookVerificationError) {
      response.status(403).send("");
    }
    logger.error("Error handling Polar webhook", error);
    return response.sendStatus(400);
  }
};
