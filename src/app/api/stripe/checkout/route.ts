import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type { CartItem } from "@/lib/types";


export async function POST(req: NextRequest) {
  try {
    const { items }: { items: CartItem[] } = await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Validate stock for each item
    for (const item of items) {
      const product = await db.getProduct(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product "${item.name}" no longer exists` }, { status: 400 });
      }
      if (!product.active) {
        return NextResponse.json({ error: `"${item.name}" is no longer available` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Only ${product.stock} of "${item.name}" left in stock` },
          { status: 400 }
        );
      }
    }

    // Create Stripe Checkout Session
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "AU"] },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 500 });
    }

    // Create pending order in D1
    const orderId = await db.createOrder({
      stripeSessionId: session.id,
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.name,
        productSlug: i.slug,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
      subtotalCents: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    });

    // Store orderId in session metadata
    await getStripe().checkout.sessions.update(session.id, {
      metadata: { orderId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[stripe/checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
