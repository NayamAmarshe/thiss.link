import { db } from "@/lib/firebase";
import { UserDocument } from "@/types/documents";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import { generateAccessToken } from "../../../lib/generate-acces-token";

const base = process.env.PAYPAL_BASE_URL;

export const runtime = "edge";

export interface VerifySubscriptionRequest extends NextApiRequest {
  body: {
    subscriptionId: string;
    userId: string;
  };
}

export type VerifySubscriptionResponse = {
  success: boolean;
};

export default async function handler(
  req: VerifySubscriptionRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { subscriptionId, userId } = req.body;

    if (!subscriptionId || !userId) {
      return res.status(400).json({ error: "Missing required parameters" });
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
