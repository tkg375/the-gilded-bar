import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyCustomerToken, hashPassword, CUSTOMER_COOKIE } from "@/lib/customer-auth";

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyCustomerToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, currentPassword, newPassword } = await req.json();
  const updates: { name?: string; email?: string; passwordHash?: string } = {};

  if (name !== undefined) updates.name = name.trim();
  if (email !== undefined) updates.email = email.toLowerCase().trim();

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to set a new one" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    const customer = await db.getCustomerByEmail(payload.email);
    if (!customer) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const { verifyPassword } = await import("@/lib/customer-auth");
    const valid = await verifyPassword(currentPassword, customer.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

    updates.passwordHash = await hashPassword(newPassword);
  }

  await db.updateCustomer(payload.sub, updates);
  return NextResponse.json({ ok: true });
}
