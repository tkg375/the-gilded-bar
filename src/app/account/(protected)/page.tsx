import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { LogoutButton } from "@/components/account/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  const payload = token ? await verifyCustomerToken(token) : null;
  if (!payload) redirect("/account/login");

  const customer = await db.getCustomerById(payload.sub);
  if (!customer) redirect("/account/login");

  return (
    <main className="max-w-lg mx-auto px-4 py-20">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1
            className="font-serif text-4xl mb-1"
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #d97706 40%, #92400e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            My Account
          </h1>
          <p className="text-stone-400 text-sm tracking-wide uppercase">
            {customer.name || customer.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      <Link
        href="/account/profile"
        className="flex items-center justify-between border border-stone-200 hover:border-amber-300 rounded-2xl px-6 py-5 transition group"
      >
        <div>
          <p className="text-sm font-medium text-stone-700 group-hover:text-amber-800 transition">Profile</p>
          <p className="text-xs text-stone-400 mt-0.5">Edit your name, email, password, and shipping addresses</p>
        </div>
        <svg className="w-4 h-4 text-stone-300 group-hover:text-amber-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </main>
  );
}
