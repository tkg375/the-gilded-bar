import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await db.getOrder(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Already processed — idempotent
    if (order.status === "paid") return NextResponse.json({ status: "paid" });

    // stripe_session_id holds the payment intent ID (pi_...)
    const piId = order.stripeSessionId;
    if (!piId?.startsWith("pi_")) {
      return NextResponse.json({ status: order.status });
    }

    const pi = await getStripe().paymentIntents.retrieve(piId);

    if (pi.status !== "succeeded") {
      return NextResponse.json({ status: order.status });
    }

    // Get customer email from the charge
    let customerEmail = order.customerEmail;
    if (!customerEmail && typeof pi.latest_charge === "string") {
      try {
        const charge = await getStripe().charges.retrieve(pi.latest_charge);
        customerEmail = charge.billing_details?.email ?? "";
      } catch { /* non-fatal */ }
    }

    // Get shipping from the payment intent
    const piShipping = pi.shipping;

    await db.updateOrder(orderId, {
      status: "paid",
      stripePaymentIntentId: pi.id,
      customerEmail,
      shippingAddress: piShipping?.address ? {
        name: piShipping.name ?? "",
        line1: piShipping.address.line1 ?? "",
        line2: piShipping.address.line2 ?? "",
        city: piShipping.address.city ?? "",
        state: piShipping.address.state ?? "",
        postalCode: piShipping.address.postal_code ?? "",
        country: piShipping.address.country ?? "",
      } : undefined,
    });

    // Decrement stock for each item
    for (const item of order.items) {
      await db.decrementStock(item.productId, item.quantity);
    }

    return NextResponse.json({ status: "paid" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[confirm-order]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
