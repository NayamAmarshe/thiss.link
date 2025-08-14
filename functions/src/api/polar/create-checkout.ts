import { onCall } from "firebase-functions/https";
import { logger } from "../../lib/logger";
import { Polar } from "@polar-sh/sdk";
import * as admin from "firebase-admin";

export type CreatePolarCheckoutRequest = {
  userId: string;
  productId?: string;
  successUrl?: string;
};

export type CreatePolarCheckoutResponse = {
  status: "success" | "error";
  message?: string;
  url?: string;
};

const DEFAULT_PRODUCT_ID = "812a8355-ef1f-4e82-81c3-d418f28090bc";

export const createPolarCheckout = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    region: ["us-central1"],
  },
  async (req): Promise<CreatePolarCheckoutResponse> => {
    try {
      const token = process.env.POLAR_ACCESS_TOKEN || "";
      if (!token) {
        logger.error("POLAR_ACCESS_TOKEN not configured");
        return { status: "error", message: "Service unavailable" };
      }

      if (!req.auth?.uid) {
        logger.error("Unauthorized request");
        return { status: "error", message: "Unauthorized" };
      }

      const body = (req.data || {}) as CreatePolarCheckoutRequest;
      const userId = body.userId;
      const productId = body.productId || DEFAULT_PRODUCT_ID;
      const successUrl =
        body.successUrl ||
        (process.env.NODE_ENV === "development"
          ? "http://localhost:3000/?checkout=success"
          : "https://thiss.link/?checkout=success");

      if (!userId) {
        return { status: "error", message: "Missing userId" };
      }

      // Fetch the user email from the database
      const user = await admin.auth().getUser(userId);
      const email = user.email;

      const polar = new Polar({
        accessToken: token,
        server:
          process.env.NODE_ENV === "development" ? "sandbox" : "production",
      });

      logger.info("Creating Polar checkout", {
        userId,
        productId,
        nodeEnv: process.env.NODE_ENV,
      });
      // Create a checkout session for the provided product
      const checkout = await polar.checkouts.create({
        products: [productId], // This should be a valid Product UUID from Polar
        successUrl: successUrl,
        metadata: {
          userId,
          email: email || "",
        },
      });

      if (!checkout || !checkout.url) {
        logger.error("Polar checkout did not return a URL", { checkout });
        return { status: "error", message: "Failed to create checkout" };
      }

      logger.info("Polar checkout created", {
        productId,
        userId,
        url: checkout.url,
      });
      return { status: "success", url: checkout.url };
    } catch (error: any) {
      logger.error("Error creating Polar checkout", error);
      return {
        status: "error",
        message: error?.message || "Failed to create checkout",
      };
    }
  },
);
