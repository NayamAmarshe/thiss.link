import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePayPalSubscription } from "@/hooks/usePayPalSubscription";
import { PayPalButtons } from "@paypal/react-paypal-js";
import useUser from "../hooks/use-user";

export default function PricingPlan({
  perks,
  mostPopular = false,
  planName,
  description,
  price,
  planId,
}: {
  perks: string[];
  mostPopular?: boolean;
  planName: string;
  description: string;
  price: string;
  planId?: string;
}) {
  const {
    isLoading,
    isReady,
    subscriptionOnApproveHandler,
    createSubscriptionHandler,
  } = usePayPalSubscription(planId || "");

  const { isLoggedIn, userDocument, handleLogin, userLoading } = useUser();

  return (
    <div className="flex flex-col justify-between rounded-base border-2 border-border bg-white p-5 dark:border-darkBorder dark:bg-secondaryBlack">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-heading">{planName}</h3>
          {mostPopular && (
            <span className="rounded-base border-2 border-border bg-main px-2 py-0.5 text-sm text-text dark:border-darkBorder">
              Most popular
            </span>
          )}
        </div>
        <p className="mb-3 mt-1">{description}</p>
        <div>
          <span className="text-3xl font-heading">${price}</span>{" "}
          <span>/month</span>{" "}
        </div>
        <ul className="mt-8 flex flex-col gap-2">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <Check className="h-5 w-5 text-mainAccent" strokeWidth={5} />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8">
        {isLoggedIn ? null : (
          <Button
            onClick={handleLogin}
            className="w-full"
            disabled={userLoading}
          >
            Get Started
          </Button>
        )}

        {isLoggedIn &&
          !userDocument?.subscription?.subscriptionId &&
          planId && (
            <div className={cn("w-full", { "opacity-50": isLoading })}>
              {isReady && (
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  createSubscription={(_, actions) => {
                    return actions.subscription.create({
                      plan_id: planId,
                    });
                  }}
                  onApprove={subscriptionOnApproveHandler}
                />
              )}
            </div>
          )}

        {isLoggedIn && userDocument?.subscription?.subscriptionId && planId && (
          <div className={cn("w-full", { "opacity-50": isLoading })}>
            {isReady && (
              <a
                href={
                  process.env.NODE_ENV === "development"
                    ? "https://www.sandbox.paypal.com/myaccount/autopay/"
                    : "https://www.paypal.com/myaccount/autopay/"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
                role="link"
              >
                <Button className="w-full" type="button">
                  Manage Subscription
                </Button>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
