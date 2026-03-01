import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 }
    );
  }

  // ── checkout.session.completed (legacy hosted checkout) ──────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) return NextResponse.json({ received: true });

    const order = await db.getOrder(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status === "paid") return NextResponse.json({ received: true });

    const rawSession = session as unknown as Record<string, unknown>;
    const shipping = rawSession.shipping_details as
      | { name?: string; address?: Record<string, string> }
      | undefined;

    await db.updateOrder(orderId, {
      status: "paid",
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : "",
      customerEmail: session.customer_details?.email ?? "",
      shippingAddress: shipping?.address
        ? {
            name: shipping.name ?? "",
            line1: shipping.address.line1 ?? "",
            line2: shipping.address.line2 ?? "",
            city: shipping.address.city ?? "",
            state: shipping.address.state ?? "",
            postalCode: shipping.address.postal_code ?? "",
            country: shipping.address.country ?? "",
          }
        : undefined,
    });

    for (const item of order.items) {
      await db.decrementStock(item.productId, item.quantity);
    }
  }

  // ── payment_intent.succeeded (custom checkout) ───────────────────────────────
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata?.orderId;

    if (!orderId) return NextResponse.json({ received: true });

    const order = await db.getOrder(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Idempotency guard — don't double-decrement stock
    if (order.status === "paid") return NextResponse.json({ received: true });

    // Get customer email from the charge's billing_details
    let customerEmail = "";
    if (typeof pi.latest_charge === "string") {
      try {
        const charge = await getStripe().charges.retrieve(pi.latest_charge);
        customerEmail = charge.billing_details?.email ?? "";
      } catch {
        // Non-fatal — order is still fulfilled, email just won't be stored
      }
    }

    // Shipping is stored on pi.shipping when passed via confirmParams.shipping
    const piShipping = pi.shipping;

    await db.updateOrder(orderId, {
      status: "paid",
      stripePaymentIntentId: pi.id,
      customerEmail,
      shippingAddress: piShipping?.address
        ? {
            name: piShipping.name ?? "",
            line1: piShipping.address.line1 ?? "",
            line2: piShipping.address.line2 ?? "",
            city: piShipping.address.city ?? "",
            state: piShipping.address.state ?? "",
            postalCode: piShipping.address.postal_code ?? "",
            country: piShipping.address.country ?? "",
          }
        : undefined,
    });

    for (const item of order.items) {
      await db.decrementStock(item.productId, item.quantity);
    }
  }

  return NextResponse.json({ received: true });
}
