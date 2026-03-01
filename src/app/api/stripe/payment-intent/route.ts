import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";
import type { CartItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { items }: { items: CartItem[] } = await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate stock
    for (const item of items) {
      const product = await db.getProduct(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product "${item.name}" no longer exists` }, { status: 400 });
      }
      if (!product.active) {
        return NextResponse.json({ error: `"${item.name}" is no longer available` }, { status: 400 });
      }
      const isComingSoon = product.comingSoon && (!product.availableAt || new Date() < new Date(product.availableAt));
      if (isComingSoon) {
        return NextResponse.json({ error: `"${item.name}" is not yet available for purchase` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Only ${product.stock} of "${item.name}" left in stock` },
          { status: 400 }
        );
      }
    }

    // Get logged-in customer ID if available
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
    const payload = token ? await verifyCustomerToken(token) : null;
    const customerId = payload?.sub ?? undefined;

    const totalCents = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Create PaymentIntent
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      payment_method_types: ["card"],
    });

    // Create pending order — store pi_... in stripeSessionId and link to customer if logged in
    const orderId = await db.createOrder({
      stripeSessionId: paymentIntent.id,
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.name,
        productSlug: i.slug,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
      subtotalCents: totalCents,
      customerId,
    });

    // Attach orderId so the webhook can find the order
    await getStripe().paymentIntents.update(paymentIntent.id, {
      metadata: { orderId },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, orderId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[stripe/payment-intent]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
