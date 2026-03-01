import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";
import { db } from "@/lib/db";

const CANCEL_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  const payload = token ? await verifyCustomerToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await db.getCustomerById(payload.sub);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await db.getOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Verify this order belongs to the customer
  const ownsOrder =
    (order.customerId && order.customerId === customer.id) ||
    (order.customerEmail && order.customerEmail.toLowerCase() === customer.email.toLowerCase());
  if (!ownsOrder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only allow cancelling pending or paid orders
  if (order.status === "shipped" || order.status === "delivered" || order.status === "cancelled") {
    return NextResponse.json({ error: "This order can no longer be cancelled" }, { status: 400 });
  }

  // Enforce 30-minute window
  const placedAt = new Date(order.createdAt).getTime();
  if (Date.now() - placedAt > CANCEL_WINDOW_MS) {
    return NextResponse.json({ error: "The 30-minute cancellation window has passed" }, { status: 400 });
  }

  const previousStatus = order.status;
  await db.updateOrder(id, { status: "cancelled" });

  // Restore stock if payment had already been processed
  if (previousStatus === "paid") {
    for (const item of order.items) {
      await db.incrementStock(item.productId, item.quantity);
    }
  }

  return NextResponse.json({ ok: true });
}
