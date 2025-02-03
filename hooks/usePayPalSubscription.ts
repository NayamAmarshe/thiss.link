import { useEffect } from "react";
import { useToast } from "./use-toast";
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
} from "@/functions/src/verify-subscription";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebase";

export const usePayPalSubscription = (planId: string) => {
  const [{ isResolved, isPending }, paypalDispatch] = usePayPalScriptReducer();
  const { isLoggedIn, user, handleLogin, userLoading } = useUser();
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: "Please select a plan to subscribe",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    if (!data.subscriptionID) {
      toast({
        title: "Error",
        description: "Subscription ID not found",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: responseData.data.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Your subscription has been activated!",
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please contact support.",
        variant: "destructive",
      });
    }
  };

  return {
    isLoading: isPending,
    isReady: isResolved,
    subscriptionOnApproveHandler,
    createSubscriptionHandler,
  };
};
