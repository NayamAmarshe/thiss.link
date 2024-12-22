import { db } from "@/lib/firebase";
import { UserDocument } from "@/types/documents";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import { generateAccessToken } from "../generate-acces-token";

const base = process.env.PAYPAL_BASE_URL;

export const runtime = "edge";

export interface VerifySubscriptionRequest {
  subscriptionId: string;
  userId: string;
}

export type VerifySubscriptionResponse = {
  status: "success" | "error";
  message: string;
};

export async function verifySubscription({
  subscriptionId,
  userId,
}: VerifySubscriptionRequest): Promise<VerifySubscriptionResponse> {
  try {
    if (!subscriptionId || !userId) {
      return { status: "error", message: "Missing required parameters" };
    }

    const token = await generateAccessToken();
    console.log("🚀 => token:", token);

    // Get subscription details from PayPal
    const subscriptionRes = await fetch(
      `${base}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const subscription = await subscriptionRes.json();
    console.log("🚀 => subscription:", subscription);

    const userRef = doc(db, "users", userId);
    const userData: Partial<UserDocument> = {
      subscription: {
        subscriptionId,
        status: subscription.status,
        planDuration: "monthly",
        startPaymentTime: Timestamp.fromDate(new Date(subscription.start_time)),
        lastPaymentTime: Timestamp.fromDate(
          new Date(subscription.billing_info.last_payment.time),
        ),
        nextPaymentTime: Timestamp.fromDate(
          new Date(subscription.billing_info.next_billing_time),
        ),
        planId: subscription.plan_id,
      },
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(userRef, userData);

    return { status: "success", message: "Subscription verified" };
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return { status: "error", message: "Internal server error" };
  }
}
