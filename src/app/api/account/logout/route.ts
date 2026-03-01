import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CUSTOMER_COOKIE } from "@/lib/customer-auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return NextResponse.json({ ok: true });
}
