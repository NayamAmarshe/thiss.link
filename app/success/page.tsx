"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import type {
  GetCheckoutStatusRequest,
  GetCheckoutStatusResponse,
} from "@/functions/src/api/polar/get-checkout-status";

type PageState = "loading" | "success" | "error";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [checkoutData, setCheckoutData] = useState<any>(null);

  useEffect(() => {
    const handleCheckoutSuccess = async () => {
      const checkoutId = searchParams.get("checkout_id");

      if (!checkoutId) {
        // No checkout ID found
        toast.error("Invalid checkout session");
        setPageState("error");
        return;
      }

      try {
        const getCheckoutStatus = httpsCallable<
          GetCheckoutStatusRequest,
          GetCheckoutStatusResponse
        >(functions, "getCheckoutStatus");

        const res = await getCheckoutStatus({ checkoutId });
        const data = res.data;

        if (!data || data.status !== "success") {
          // Error fetching checkout status
          setPageState("error");
          return;
        }

        setCheckoutData(data.data);

        // Check if checkout was successful
        if (
          data.checkoutStatus === "succeeded" ||
          data.checkoutStatus === "confirmed"
        ) {
          // Successful checkout
          setPageState("success");
        } else {
          // Checkout not successful
          setPageState("error");
        }
      } catch (error) {
        console.error("Error fetching checkout status:", error);
        setPageState("error");
      }
    };

    handleCheckoutSuccess();
  }, [searchParams]);

  const handleGetStarted = () => {
    router.push("/");
  };

  if (pageState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="bg-card text-card-foreground w-full max-w-md rounded-lg border shadow-xs">
          <div className="flex flex-col items-center space-y-4 p-6">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <div className="space-y-2 text-center">
              <p className="text-lg font-medium">Processing your checkout...</p>
              <p className="text-muted-foreground text-sm">
                This should only take a moment
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg border shadow-xs">
        <div className="p-8">
          <div className="space-y-6 text-center">
            {pageState === "success" ? (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    🎉 You&apos;re not a sigma!
                  </h1>
                  <p className="text-muted-foreground">
                    Thanks for your support! Your checkout has been processed
                    successfully.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                    <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    You&apos;re not a sigma!
                  </h1>
                  <p className="text-muted-foreground">
                    Something went wrong with your checkout. Please try again.
                  </p>
                </div>
              </>
            )}

            <Button onClick={handleGetStarted} className="w-full" size="lg">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-muted-foreground text-xs">
              {pageState === "success"
                ? "Ready to create your first link?"
                : "Need help? Contact our support team"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
