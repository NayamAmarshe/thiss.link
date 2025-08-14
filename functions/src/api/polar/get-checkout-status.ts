import { onCall } from "firebase-functions/https";
import { logger } from "../../lib/logger";
import { Polar } from "@polar-sh/sdk";

export type GetCheckoutStatusRequest = {
  checkoutId: string;
};

export type GetCheckoutStatusResponse = {
  status: "success" | "error";
  message?: string;
  checkoutStatus?: string;
  data?: any;
};

export const getCheckoutStatus = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    region: ["us-central1"],
  },
  async (req): Promise<GetCheckoutStatusResponse> => {
    try {
      const token = process.env.POLAR_ACCESS_TOKEN || "";
      if (!token) {
        logger.error("POLAR_ACCESS_TOKEN not configured");
        return { status: "error", message: "Service unavailable" };
      }

      const body = (req.data || {}) as GetCheckoutStatusRequest;
      const { checkoutId } = body;

      if (!checkoutId) {
        return { status: "error", message: "Missing checkoutId" };
      }

      const polar = new Polar({
        accessToken: token,
        server:
          process.env.NODE_ENV === "development" ? "sandbox" : "production",
      });

      logger.info("Fetching checkout status", {
        checkoutId,
        nodeEnv: process.env.NODE_ENV,
      });

      // Get checkout details from Polar
      const checkout = await polar.checkouts.get({
        id: checkoutId,
      });

      if (!checkout) {
        logger.error("Checkout not found", { checkoutId });
        return { status: "error", message: "Checkout not found" };
      }

      logger.info("Checkout status retrieved", {
        checkoutId,
        status: checkout.status,
      });

      return {
        status: "success",
        checkoutStatus: checkout.status,
        data: checkout,
      };
    } catch (error: any) {
      logger.error("Error fetching checkout status", error);
      return {
        status: "error",
        message: error?.message || "Failed to fetch checkout status",
      };
    }
  },
);
