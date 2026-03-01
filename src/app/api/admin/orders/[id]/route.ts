import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";


async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await db.getOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json();
  const validStatuses: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await db.getOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.updateOrder(id, { status });

  // Restore stock when cancelling a paid/shipped/delivered order
  const stockWasDecremented = ["paid", "shipped", "delivered"].includes(order.status);
  if (status === "cancelled" && order.status !== "cancelled" && stockWasDecremented) {
    for (const item of order.items) {
      await db.incrementStock(item.productId, item.quantity);
    }
  }

  return NextResponse.json({ success: true });
}
