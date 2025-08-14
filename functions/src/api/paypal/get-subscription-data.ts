import { logger } from "firebase-functions/v1";
import { generateAccessToken } from "./generate-acces-token";

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL;

export const getSubscriptionDetails = async (subscriptionId: string) => {
  let subscriptionData: any | null = null;
  try {
    if (subscriptionId) {
      /**
       * If the subscriptionId is provided, we need to get the subscription details
       */
      const accessToken = await generateAccessToken();
      /**
       * Get the subscription details
       * @see https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_get
       */
      const subscriptionResponse = await fetch(
        `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        },
      );
      subscriptionData = await subscriptionResponse.json();
    }
  } catch (error) {
    logger.error(error);
  }

  return subscriptionData;
};
