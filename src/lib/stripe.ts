import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
      // Required for Cloudflare Workers — uses fetch instead of Node.js https
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return _stripe;
}
