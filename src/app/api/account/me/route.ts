import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";
import { db } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyCustomerToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await db.getCustomerById(payload.sub);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email });
}
