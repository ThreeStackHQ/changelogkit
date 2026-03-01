import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    maxProjects: 1,
    maxEntriesPerMonth: 3,
    widget: false,
    subscriberEmails: false,
    customDomain: false,
    brandedEmails: false,
    aiDrafts: false,
  },
  starter: {
    name: "Starter",
    price: 9,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    maxProjects: Infinity,
    maxEntriesPerMonth: Infinity,
    widget: true,
    subscriberEmails: true,
    customDomain: false,
    brandedEmails: false,
    aiDrafts: false,
  },
  pro: {
    name: "Pro",
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    maxProjects: Infinity,
    maxEntriesPerMonth: Infinity,
    widget: true,
    subscriberEmails: true,
    customDomain: true,
    brandedEmails: true,
    aiDrafts: true,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
