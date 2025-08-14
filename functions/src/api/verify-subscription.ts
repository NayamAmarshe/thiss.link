import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/https";
import { generateAccessToken } from "./paypal/generate-acces-token";
import { db } from "../lib/db";

const base = process.env.PAYPAL_BASE_URL;

export type VerifySubscriptionRequest = {
  subscriptionId: string;
  userId: string;
};

export type VerifySubscriptionResponse = {
  status: string;
  message: string;
};

export const verifySubscription = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    region: ["us-central1"],
  },
  async (req) => {
    console.log("verifySubscription called!");
    try {
      const { subscriptionId, userId } = req.data as VerifySubscriptionRequest;

      if (!subscriptionId || !userId) {
        return {
          status: "error",
          message: "Missing required parameters",
        };
      }

      const token = await generateAccessToken();
      const subscriptionRes = await fetch(
        `${base}/v1/billing/subscriptions/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!subscriptionRes.ok) {
        return {
          status: "error",
          message: "Failed to fetch subscription details",
        };
      }

      const subscription = await subscriptionRes.json();
      const userRef = db.collection("users").doc(userId);
      const userData = {
        subscription: {
          subscriptionId,
          status: subscription.status,
          planDuration: "monthly",
          startPaymentTime: admin.firestore.Timestamp.fromDate(
            new Date(subscription.start_time),
          ),
          lastPaymentTime: admin.firestore.Timestamp.fromDate(
            new Date(subscription.billing_info.last_payment.time),
          ),
          nextPaymentTime: admin.firestore.Timestamp.fromDate(
            new Date(subscription.billing_info.next_billing_time),
          ),
          planId: subscription.plan_id,
        },
        updatedAt: new Date().toISOString(),
      };

      await userRef.update(userData);

      return {
        status: "success",
        message: "Subscription verified",
      };
    } catch (error) {
      console.error("Error verifying subscription:", error);
      return {
        status: "error",
        message: "Internal server error",
      };
    }
  },
);
