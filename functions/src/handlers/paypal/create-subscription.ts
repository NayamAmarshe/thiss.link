import { logger, Response } from "firebase-functions/v1";
import { generateAccessToken } from "./generate-acces-token";
import { Firestore } from "firebase-admin/firestore";
import { Request } from "firebase-functions/https";
import { checkAuth } from "src/lib/check-auth";
import { UserDocument } from "../../../../types/documents";

const base = process.env.PAYPAL_BASE_URL;

export const createSubscriptionHandler = async (
  request: Request,
  response: Response,
  db: Firestore,
) => {
  // Check authorization
  const auth = await checkAuth(request);
  if (auth.status !== 200) {
    return response.status(auth.status).send(auth.message);
  }

  const { planId, userId } = request.body.data;
  if (!planId || !userId) {
    return response.status(404).send({ error: "User not found" });
  }

  try {
    // Check for existing active subscription
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return response.status(404).send({ error: "User not found" });
    }
    const userDocument = userDoc.data() as UserDocument;
    if (
      userDocument &&
      userDocument.subscription?.status === "ACTIVE" &&
      userDocument.isSubscribed
    ) {
      return response
        .status(400)
        .json({ error: "User already has an active subscription" });
    }

    const accessToken = await generateAccessToken();

    logger.info(
      "Creating subscription for user:",
      userDocument.uid,
      "with the plan",
      planId,
    );

    /**
     * Create a subscription for the customer
     * @see https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_create
     */
    const subscriptionResponse = await fetch(
      `${base}/v1/billing/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          plan_id: planId,
          custom_id: userDocument.uid,
          application_context: {
            user_action: "SUBSCRIBE_NOW",
            return_url:
              process.env.NODE_ENV === "development"
                ? "https://localhost:3000/"
                : "https://thiss.link/",
            cancel_url:
              process.env.NODE_ENV === "development"
                ? "https://localhost:3000/"
                : "https://thiss.link/",
          },
          subscriber: {
            email_address: userDocument.email,
            name: {
              given_name: userDocument.name,
            },
          },
        }),
      },
    );
    const data = await subscriptionResponse.json();
    return response.status(200).json({
      status: "success",
      data,
    });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return response
      .status(500)
      .json({ error: "Failed to create subscription." });
  }
};
