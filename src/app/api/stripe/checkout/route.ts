import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { firestore } from "@/lib/firebase-admin";
import type { CartItem, Product } from "@/lib/types";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { items }: { items: CartItem[] } = await req.json();

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Validate stock for each item
  for (const item of items) {
    const doc = await firestore.getDoc("products", item.productId);
    if (!doc.exists) {
      return NextResponse.json({ error: `Product "${item.name}" no longer exists` }, { status: 400 });
    }
    const product = doc.data as unknown as Product;
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

  // Create pending order in Firestore
  const orderId = await firestore.addDoc("orders", {
    stripePaymentIntentId: "",
    stripeSessionId: "",
    items: items.map((i) => ({
      productId: i.productId,
      productName: i.name,
      productSlug: i.slug,
      quantity: i.quantity,
      unitPrice: i.price,
    })),
    customerEmail: "",
    status: "pending",
    shippingAddress: {},
    subtotalCents: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    createdAt: new Date().toISOString(),
  });

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
    metadata: { orderId },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancel`,
  });

  // Update order with session ID
  await firestore.updateDoc("orders", orderId, { stripeSessionId: session.id });

  return NextResponse.json({ url: session.url });
}
