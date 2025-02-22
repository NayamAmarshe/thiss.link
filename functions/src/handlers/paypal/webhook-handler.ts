import { Request } from "firebase-functions/https";
import { logger, Response } from "firebase-functions/v1";
import { Firestore, Timestamp } from "firebase-admin/firestore";
import crypto from "crypto";
import crc32 from "buffer-crc32";
import { UserDocument } from "../../../../types/documents";
import { getSubscriptionDetails } from "./get-subscription-data";

const MOCK_WEBHOOK_ID = "WEBHOOK_ID";
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
// Global cache object to store data across invocations
const GLOBAL_CACHE: Record<string, string> = {};

const downloadAndCache = async (url: string) => {
  const cacheKey = url.replace(/\W+/g, "-");
  // Check if cached file exists
  const cachedData = GLOBAL_CACHE[cacheKey];
  if (cachedData) {
    return cachedData;
  }
  // Download the file if not cached
  const response = await fetch(url);
  const data = await response.text();
  GLOBAL_CACHE[cacheKey] = data;
  return data;
};

const verifySignature = async (event: any, headers: any) => {
  const transmissionId = headers["paypal-transmission-id"];
  const timeStamp = headers["paypal-transmission-time"];
  const crc = parseInt("0x" + crc32(JSON.stringify(event)).toString("hex")); // hex crc32 of raw event data, parsed to decimal form
  const USE_MOCK_WEBHOOK_ID = false;
  const message = `${transmissionId}|${timeStamp}|${
    USE_MOCK_WEBHOOK_ID ? MOCK_WEBHOOK_ID : PAYPAL_WEBHOOK_ID
  }|${crc}`;
  const certPem = await downloadAndCache(headers["paypal-cert-url"]);
  // Create buffer from base64-encoded signature
  const signatureBuffer = Buffer.from(
    headers["paypal-transmission-sig"],
    "base64",
  );
  // Create a verification object
  const verifier = crypto.createVerify("SHA256");
  // Add the original message to the verifier
  verifier.update(message);
  return verifier.verify(certPem, signatureBuffer);
};

export const paypalWebhookHandler = async (
  request: Request,
  response: Response,
  db: Firestore,
) => {
  const headers = request.headers;
  const event = request.body;

  if (!event) {
    logger.warn("No event data received");
    return response.sendStatus(400);
  }

  const currentDate = new Date();

  try {
    const isSignatureValid = await verifySignature(event, headers);
    if (isSignatureValid) {
      const eventName: string = event?.event_type;
      const eventResourceData: any = event?.resource;
      logger.info("Webhook event detected", {
        eventName,
        eventResourceData,
        eventId: event?.id,
      });

      // FETCH SUBSCRIPTION DATA
      const subscriptionId =
        eventName === "PAYMENT.SALE.COMPLETED"
          ? eventResourceData.billing_agreement_id
          : eventResourceData?.id;

      let subscriptionData = eventResourceData;
      if (subscriptionId && eventName === "PAYMENT.SALE.COMPLETED") {
        subscriptionData = await getSubscriptionDetails(subscriptionId);
      }
      if (!subscriptionData) {
        logger.error(`Subscription not found for ${subscriptionId}`);
        return response.status(404).send({ error: "Subscription not found" });
      }

      // FETCH USER DATA
      const userId =
        eventResourceData?.custom_id ||
        eventResourceData?.custom ||
        subscriptionData?.custom_id;
      const userRef = db.doc(`users/${userId}`);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        console.error(`User not found for ${userId}`);
        return response.status(404).send({ error: "User not found" });
      }
      const userData = userDoc.data() as UserDocument;

      switch (eventName) {
        case "PAYMENT.SALE.COMPLETED":
          logger.info("Payment sale completed", subscriptionData);
          // Store old subscription data
          await db.doc(`users/${userId}/paymentHistory/${subscriptionId}`).set({
            ...userData.subscription,
            subscriptionId,
            updatedAt: Timestamp.fromDate(currentDate),
          });

          if (
            !userData.subscription ||
            (userData.subscription &&
              userData.subscription?.status !== "ACTIVE")
          ) {
            // Add user to subscribed-users collection
            await db
              .collection("subscribed-users")
              .doc(userId)
              .set({
                userId,
                joinDate: Timestamp.fromDate(currentDate),
                email: userData.email,
                planId: subscriptionData.plan_id,
              });
            // posthog.capture({
            //   distinctId: userId,
            //   event: "subscription_successful",
            //   properties: {
            //     plan_id: subscriptionData.plan_id,
            //     subscription_id: subscriptionId,
            //     plan_credits: planCredits,
            //     planDuration: subscriptionPlanDetails.planDuration,
            //     user_id: userId,
            //     user_email: userData.email,
            //   },
            // });
          } else {
            // posthog.capture({
            //   distinctId: userId,
            //   event: "subscription_continued",
            //   properties: {
            //     plan_id: subscriptionData.plan_id,
            //     subscription_id: subscriptionId,
            //     user_id: userId,
            //     user_email: userData.email,
            //   },
            // });
          }
          await userRef.update({
            payment: {
              planDuration: "monthly",
              lastPaymentTime: Timestamp.fromDate(
                new Date(subscriptionData.billing_info.last_payment.time),
              ),
              startPaymentTime: Timestamp.fromDate(
                new Date(subscriptionData.start_time),
              ),
              nextPaymentTime: Timestamp.fromDate(
                new Date(subscriptionData.billing_info.next_billing_time),
              ),
              status: subscriptionData.status,
              planId: subscriptionData.plan_id,
              subscriptionId,
            },
            isSubscribed: true,
          } as Partial<UserDocument>);
          break;
        case "BILLING.SUBSCRIPTION.CANCELLED":
          logger.info("Subscription cancelled", subscriptionData);
          // Remove user from subscribed-users collection
          await db.collection("subscribed-users").doc(userId).delete();
          // posthog.capture({
          //   distinctId: userId,
          //   event: "subscription_cancelled",
          //   properties: {
          //     plan_id: subscriptionData.plan_id,
          //     subscription_id: subscriptionId,
          //     user_id: userId,
          //     user_email: userData.email,
          //     plan_credits: planCredits,
          //     planDuration: subscriptionPlanDetails.planDuration,
          //   },
          // });
          // Store old subscription data
          await db.doc(`users/${userId}/paymentHistory/${subscriptionId}`).set({
            ...userData.subscription,
            subscriptionId,
            updatedAt: Timestamp.fromDate(currentDate),
          });
          logger.info("Updating user subscription status");
          // Handle subscription cancellation
          await userRef.update({
            lastCreditsUpdate: Timestamp.fromDate(currentDate),
            payment: {
              ...userData.subscription,
              subscriptionStatus: subscriptionData.status,
              lastPaymentTime: Timestamp.fromDate(
                new Date(subscriptionData.billing_info.last_payment.time),
              ),
              paymentStartTime: Timestamp.fromDate(
                new Date(subscriptionData.start_time),
              ),
              planId: subscriptionData.plan_id,
            },
          } as Partial<UserDocument>);
          break;
      }
    } else {
      logger.error(
        `Signature is not valid for event: ${event?.id}, subscription: ${event.resource.id}. correlation-id: ${headers?.["correlation-id"]}`,
      );
      return response.sendStatus(400);
    }
  } catch (error) {
    logger.error("Error processing webhook", error);
    return response.sendStatus(400);
  }

  logger.log(`Webhook ${event.id} processed successfully`);
  // Return a 200 response to mark successful webhook delivery
  return response.sendStatus(200);
};
