import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { UserDocument } from "@/types/documents";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { generateAccessToken } from "./generate-acces-token";

const base = process.env.PAYPAL_BASE_URL;

export const dynamic = "force-dynamic";

export interface VerifySubscriptionRequest {
  subscriptionId: string;
  userId: string;
}

export type VerifySubscriptionResponse = {
  status: "success" | "error";
  message: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { subscriptionId, userId }: VerifySubscriptionRequest = body;

    if (!subscriptionId || !userId) {
      return NextResponse.json<VerifySubscriptionResponse>(
        { status: "error", message: "Missing required parameters" },
        { status: 400 },
      );
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

    if (!subscriptionRes.ok) {
      console.error(
        "Failed to fetch subscription details:",
        subscriptionRes.statusText,
      );
      return NextResponse.json<VerifySubscriptionResponse>(
        { status: "error", message: "Failed to fetch subscription details" },
        { status: subscriptionRes.status },
      );
    }

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

    return NextResponse.json<VerifySubscriptionResponse>(
      { status: "success", message: "Subscription verified" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return NextResponse.json<VerifySubscriptionResponse>(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
