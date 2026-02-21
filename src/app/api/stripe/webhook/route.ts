import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { firestore } from "@/lib/firebase-admin";
import type { OrderItem } from "@/lib/types";

export const runtime = "edge";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
    }

    // Fetch the order to get items
    const orderDoc = await firestore.getDoc("orders", orderId);
    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = (orderDoc.data.items ?? []) as OrderItem[];

    // Stripe SDK types may lag behind the API — access shipping_details via cast
    const rawSession = session as unknown as Record<string, unknown>;
    const shipping = rawSession.shipping_details as { name?: string; address?: Record<string, string> } | undefined;

    // Update order status, payment intent, and customer email
    await firestore.updateDoc("orders", orderId, {
      status: "paid",
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : "",
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
        : {},
    });

    // Decrement stock for each product
    for (const item of items) {
      const productDoc = await firestore.getDoc("products", item.productId);
      if (productDoc.exists) {
        const currentStock = Number(productDoc.data.stock ?? 0);
        const newStock = Math.max(0, currentStock - item.quantity);
        await firestore.updateDoc("products", item.productId, { stock: newStock });
      }
    }
  }

  return NextResponse.json({ received: true });
}
