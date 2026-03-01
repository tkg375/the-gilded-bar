import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-stone-100 text-stone-600" },
  paid:      { label: "Paid",      className: "bg-amber-100 text-amber-800" },
  shipped:   { label: "Shipped",   className: "bg-blue-100  text-blue-800"  },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", className: "bg-red-100   text-red-700"   },
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  const payload = token ? await verifyCustomerToken(token) : null;
  if (!payload) redirect("/account/login");

  const customer = await db.getCustomerById(payload.sub);
  if (!customer) redirect("/account/login");

  const orders: Order[] = await db.getOrdersByCustomer({ customerId: customer.id, email: customer.email });

  return (
    <main className="max-w-3xl mx-auto px-4 py-20">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-800 transition mb-8"
      >
        ← Back to account
      </Link>

      <h1
        className="font-serif text-4xl mb-2"
        style={{
          background: "linear-gradient(135deg, #fbbf24 0%, #d97706 40%, #92400e 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Order History
      </h1>
      <p className="text-stone-400 text-sm mb-10 tracking-wide uppercase">Your past orders</p>

      {orders.length === 0 ? (
        <div className="border border-stone-200 rounded-2xl p-10 text-center">
          <p className="text-stone-400 mb-4">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/shop"
            className="inline-block bg-amber-800 hover:bg-amber-900 text-white text-sm font-medium px-6 py-2.5 rounded-full transition"
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between border border-stone-200 hover:border-amber-300 rounded-2xl px-6 py-5 transition group"
              >
                <div>
                  <p className="text-sm font-medium text-stone-700 group-hover:text-amber-800 transition">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {" · "}
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-stone-700">
                    ${(order.subtotalCents / 100).toFixed(2)}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
