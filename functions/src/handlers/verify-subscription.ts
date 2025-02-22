import * as admin from "firebase-admin";
import { Request } from "firebase-functions/https";
import { generateAccessToken } from "./paypal/generate-acces-token";
import { Response } from "express";
import { Firestore } from "firebase-admin/firestore";

const base = process.env.PAYPAL_BASE_URL;

export type VerifySubscriptionRequest = {
  subscriptionId: string;
  userId: string;
};

export type VerifySubscriptionResponse = {
  status: string;
  message: string;
};

export const verifySubscriptionHandler = async (
  req: Request,
  res: Response<VerifySubscriptionResponse>,
  db: Firestore,
) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        status: "error",
        message: "Method not allowed",
      });
    }

    const { subscriptionId, userId } = req.body as VerifySubscriptionRequest;

    if (!subscriptionId || !userId) {
      return res.status(400).json({
        status: "error",
        message: "Missing required parameters",
      });
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
      return res.status(subscriptionRes.status).json({
        status: "error",
        message: "Failed to fetch subscription details",
      });
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

    return res.status(200).json({
      status: "success",
      message: "Subscription verified",
    });
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
