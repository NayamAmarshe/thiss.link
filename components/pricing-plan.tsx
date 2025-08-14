import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import useUser from "../hooks/use-user";
import { PolarSubscribeButton } from "./polar-subscribe-button";

export default function PricingPlan({
  perks,
  mostPopular = false,
  planName,
  description,
  price,
  productId,
}: {
  perks: string[];
  mostPopular?: boolean;
  planName: string;
  description: string;
  price: string;
  productId?: string;
}) {
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
        {!isLoggedIn ? (
          <Button
            onClick={handleLogin}
            className="w-full"
            disabled={userLoading}
          >
            Get Started
          </Button>
        ) : productId ? (
          <PolarSubscribeButton productId={productId} className="w-full" />
        ) : null}
      </div>
    </div>
  );
}
