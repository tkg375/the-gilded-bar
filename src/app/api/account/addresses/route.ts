import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";
import { db } from "@/lib/db";

async function getCustomerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyCustomerToken(token);
  return payload?.sub ?? null;
}

export async function GET() {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addresses = await db.listAddresses(customerId);
  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, line1, line2 = "", city, state, postalCode, country = "US", isDefault = false } = body;

    if (!name || !line1 || !city || !state || !postalCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const address = await db.createAddress(customerId, { name, line1, line2, city, state, postalCode, country, isDefault });
    return NextResponse.json(address, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
