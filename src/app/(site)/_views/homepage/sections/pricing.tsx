"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";

export interface PricingTierFrequency {
  id: string;
  value: string;
  label: string;
  priceSuffix: string;
}

export interface PricingTier {
  name: string;
  id: string;
  href: string;
  price: Record<string, string>;
  discountPrice: Record<string, string>;
  description: string;
  features: string[];
  featured?: boolean;
  highlighted?: boolean;
  soldOut?: boolean;
  cta?: string;
}

export const frequencies: PricingTierFrequency[] = [
  { id: "1", value: "1", label: "Monthly", priceSuffix: "/month" },
  { id: "2", value: "2", label: "Annually", priceSuffix: "/year" },
];

export const tiers: PricingTier[] = [
  {
    name: "Free",
    id: "0",
    href: "/subscribe",
    price: { "1": "$0", "2": "$0" },
    discountPrice: { "1": "", "2": "" },
    description: `Start discovering SaaS opportunities with our free tier.`,
    features: [
      `10 Reddit searches per day`,
      `Basic AI insights`,
      `3 saved ideas`,
      `Community support`,
    ],
    featured: false,
    highlighted: false,
    soldOut: false,
    cta: `Sign up`,
  },
  {
    name: "Pro",
    id: "1",
    href: "/subscribe",
    price: { "1": "$29", "2": "$290" },
    discountPrice: { "1": "", "2": "$249" },
    description: `Unlock the full potential of SaaS idea discovery and validation.`,
    features: [
      `Unlimited Reddit searches`,
      `Advanced AI insights with GPT-4o`,
      `Competitive analysis`,
      `Implementation complexity assessment`,
      `Unlimited saved ideas`,
      `Export to PDF/CSV`,
      `Priority support`,
    ],
    featured: false,
    highlighted: true,
    soldOut: false,
    cta: `Get started`,
  },
];

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export function PricingSection() {
  const [frequency, setFrequency] = useState(frequencies[0]);

  const bannerText = "Launch Special: 15% off annual Pro plan";

  return (
    <section id="pricing" className="py-12">
      <Card>
        <div className="w-full flex flex-col items-center">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center">
            <div className="w-full lg:w-auto mx-auto max-w-4xl lg:text-center">
              <h1 className="text-foreground text-4xl font-semibold max-w-xs sm:max-w-none md:text-6xl !leading-tight pt-8">
                Simple, Transparent Pricing
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Choose the plan that's right for your SaaS discovery journey
              </p>
            </div>

            {bannerText ? (
              <div className="w-full lg:w-auto flex justify-center my-4">
                <p className="w-full px-4 py-3 text-xs bg-muted text-muted-foreground rounded-xl">
                  {bannerText}
                </p>
              </div>
            ) : null}

            {frequencies.length > 1 ? (
              <div className="mt-16 flex justify-center">
                <RadioGroup
                  defaultValue={frequency.value}
                  onValueChange={(value: string) => {
                    setFrequency(frequencies.find((f) => f.value === value)!);
                  }}
                  className="grid gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 bg-background ring-1 ring-inset ring-border"
                  style={{
                    gridTemplateColumns: `repeat(${frequencies.length}, minmax(0, 1fr))`,
                  }}
                >
                  <Label className="sr-only">Payment frequency</Label>
                  {frequencies.map((option) => (
                    <Label
                      className={cn(
                        frequency.value === option.value
                          ? "bg-primary/90 text-primary-foreground"
                          : "bg-transparent text-muted-foreground hover:bg-primary/10",
                        "cursor-pointer rounded-full px-2.5 py-2 transition-all"
                      )}
                      key={option.value}
                      htmlFor={option.value}
                    >
                      {option.label}

                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="hidden"
                      />
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <div className="mt-12" aria-hidden="true"></div>
            )}

            <div
              className={cn(
                "isolate mx-auto mt-4 mb-28 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none",
                tiers.length === 2 ? "lg:grid-cols-2" : "",
                tiers.length === 3 ? "lg:grid-cols-3" : ""
              )}
            >
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={cn(
                    tier.featured
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card text-card-foreground ring-border",
                    "max-w-xs ring-1 rounded-3xl p-8 xl:p-10",
                    tier.highlighted ? "fancyGlassContrast" : ""
                  )}
                >
                  <h3
                    id={tier.id}
                    className={cn(
                      tier.featured
                        ? "text-primary-foreground"
                        : "text-foreground",
                      "text-2xl font-bold tracking-tight"
                    )}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className={cn(
                      tier.featured
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                      "mt-4 text-sm leading-6"
                    )}
                  >
                    {tier.description}
                  </p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span
                      className={cn(
                        tier.featured
                          ? "text-primary-foreground"
                          : "text-foreground",
                        "text-4xl font-bold tracking-tight",
                        tier.discountPrice &&
                          tier.discountPrice[frequency.value]
                          ? "line-through"
                          : ""
                      )}
                    >
                      {tier.price[frequency.value]}
                    </span>

                    <span
                      className={cn(
                        tier.featured
                          ? "text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {tier.discountPrice[frequency.value]}
                    </span>

                    <span
                      className={cn(
                        tier.featured
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                        "text-sm font-semibold leading-6"
                      )}
                    >
                      {frequency.priceSuffix}
                    </span>
                  </p>
                  <a
                    href={tier.href}
                    aria-describedby={tier.id}
                    className={cn(
                      "flex mt-6 shadow-sm",
                      tier.soldOut ? "pointer-events-none" : ""
                    )}
                  >
                    <Button
                      size="lg"
                      disabled={tier.soldOut}
                      className={cn(
                        "w-full",
                        !tier.highlighted && !tier.featured
                          ? "bg-muted-foreground text-muted-foreground-foreground hover:bg-muted-foreground/90"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground",
                        tier.featured || tier.soldOut
                          ? "bg-background text-foreground hover:bg-muted"
                          : "hover:opacity-80 transition-opacity"
                      )}
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      {tier.soldOut ? "Sold out" : tier.cta}
                    </Button>
                  </a>

                  <ul
                    className={cn(
                      tier.featured
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                      "mt-8 space-y-3 text-sm leading-6 xl:mt-10"
                    )}
                  >
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon
                          className={cn(
                            tier.featured ? "text-primary-foreground" : "",
                            tier.highlighted
                              ? "text-primary"
                              : "text-muted-foreground",
                            "h-6 w-5 flex-none"
                          )}
                          aria-hidden="true"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
