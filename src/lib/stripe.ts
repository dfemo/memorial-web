import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY?.startsWith("sk_")
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function getPriceId(plan: "PREMIUM_MONTHLY" | "PREMIUM_YEARLY" | "LIFETIME") {
  const map = {
    PREMIUM_MONTHLY: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    PREMIUM_YEARLY: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    LIFETIME: process.env.STRIPE_PRICE_LIFETIME,
  };
  return map[plan];
}

export const BILLING_COPY = {
  FREE: { name: "Basic", price: "Free", detail: "Core memorial with limited photos" },
  PREMIUM_MONTHLY: { name: "Premium", price: "$9.95/mo", detail: "Unlimited feel — expanded media & privacy" },
  PREMIUM_YEARLY: { name: "Premium Yearly", price: "$79.95/yr", detail: "Save vs monthly billing" },
  LIFETIME: { name: "Lifetime", price: "$159.95", detail: "One payment — memorial stays online" },
} as const;
