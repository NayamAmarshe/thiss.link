import { useEffect } from "react";
import {
  DISPATCH_ACTION,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import useUser from "@/hooks/use-user";
import {
  PayPalButtonCreateSubscription,
  PayPalButtonOnApprove,
} from "@paypal/paypal-js";
import {
  VerifySubscriptionRequest,
  VerifySubscriptionResponse,
} from "@/functions/src/handlers/verify-subscription";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebase";
import { toast } from "sonner";

export const usePayPalSubscription = (planId: string) => {
  const [{ isResolved, isPending }, paypalDispatch] = usePayPalScriptReducer();
  const { isLoggedIn, user, handleLogin, userLoading } = useUser();

  useEffect(() => {
    paypalDispatch({
      type: DISPATCH_ACTION.RESET_OPTIONS,
      value: {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        components: "buttons",
        intent: "subscription",
        vault: true,
      },
    });
  }, [paypalDispatch]);

  const createSubscriptionHandler: PayPalButtonCreateSubscription = async (
    _,
    actions,
  ) => {
    if (!planId) {
      toast.error("Please select a plan to subscribe");
      return "No plan found";
    }
    return actions.subscription.create({
      plan_id: planId,
    });
  };

  const subscriptionOnApproveHandler: PayPalButtonOnApprove = async (
    data,
    actions,
  ) => {
    if (!isLoggedIn || !user) {
      toast.error("Please sign in to subscribe");
      return;
    }

    if (!data.subscriptionID) {
      toast.error("Subscription ID not found");
      return;
    }

    try {
      const verifySubscription = httpsCallable<
        VerifySubscriptionRequest,
        VerifySubscriptionResponse
      >(functions, "verifySubscription");

      const responseData = await verifySubscription({
        subscriptionId: data.subscriptionID,
        userId: user.uid,
      });

      if (responseData.data.status === "error") {
        toast.error(responseData.data.message);
        return;
      }

      toast.success("Your subscription has been activated!");
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription. Please contact support.");
    }
  };

  return {
    isLoading: isPending,
    isReady: isResolved,
    subscriptionOnApproveHandler,
    createSubscriptionHandler,
  };
};
