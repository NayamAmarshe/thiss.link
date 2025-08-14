"use client";

import { Button } from "@/components/ui/button";
import useUser from "@/hooks/use-user";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebase";
import { toast } from "sonner";
import type {
  CreatePolarCheckoutRequest,
  CreatePolarCheckoutResponse,
} from "@/functions/src/api/polar/create-checkout";

type Props = {
  productId: string;
  className?: string;
};

export function PolarSubscribeButton({ productId, className }: Props) {
  const { isLoggedIn, user, handleLogin, userLoading } = useUser();

  const onSubscribe = async () => {
    if (!isLoggedIn || !user) {
      handleLogin();
      return;
    }
    try {
      const createCheckout = httpsCallable<
        CreatePolarCheckoutRequest,
        CreatePolarCheckoutResponse
      >(functions, "createPolarCheckout");

      const res = await createCheckout({ userId: user.uid, productId });
      const data = res.data;

      if (!data || data.status !== "success" || !data.url) {
        toast.error("Failed to start checkout. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <Button onClick={onSubscribe} className={className} disabled={userLoading}>
      {isLoggedIn ? "Subscribe" : "Get Started"}
    </Button>
  );
}
