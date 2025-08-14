import PricingPlan from "@/components/pricing-plan";

export default function Pricing() {
  return (
    <section className="inset-0 flex w-full snap-start snap-always flex-col items-center justify-center border-b-2 border-b-border bg-white bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px] font-base dark:border-b-darkBorder dark:bg-secondaryBlack">
      <div className="w-container mx-auto max-w-full px-5 py-20 lg:py-[100px]">
        <h2 className="mb-14 text-center text-2xl font-heading md:text-3xl lg:mb-20 lg:text-4xl">
          Pricing
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <PricingPlan
            planName="Free"
            description="I'm so generous omg! 🤗"
            price="0"
            perks={[
              "Unlimited links",
              "Encryption",
              "Password protection",
              "6 months expiration",
            ]}
          />
          <PricingPlan
            planName="🗿 Sigma Tier"
            description="For Kings and Queens 👑"
            price="6.99"
            perks={[
              "Unlimited links",
              "Unlimited custom links",
              "Custom link expiration",
              "Never expiring links",
              "Full encryption",
              "Password protection",
              "Analytics (Coming Soon)",
            ]}
            productId="REPLACE_WITH_YOUR_POLAR_PRICE_ID"
          />
        </div>
      </div>
    </section>
  );
}
