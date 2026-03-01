import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { CancelOrderButton } from "@/components/account/CancelOrderButton";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-stone-100 text-stone-600" },
  paid:      { label: "Paid",      className: "bg-amber-100 text-amber-800" },
  shipped:   { label: "Shipped",   className: "bg-blue-100  text-blue-800"  },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", className: "bg-red-100   text-red-700"   },
};

const CANCEL_WINDOW_MS = 30 * 60 * 1000;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  const payload = token ? await verifyCustomerToken(token) : null;
  if (!payload) redirect("/account/login");

  const customer = await db.getCustomerById(payload.sub);
  if (!customer) redirect("/account/login");

  const order = await db.getOrder(id);

  // Allow access if order belongs to this customer by ID or email
  const ownsOrder = order && (
    (order.customerId && order.customerId === customer.id) ||
    (order.customerEmail && order.customerEmail.toLowerCase() === customer.email.toLowerCase())
  );
  if (!ownsOrder) notFound();

  const status = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;

  // Show cancel button only within 30-min window and for cancellable statuses
  const placedAt = new Date(order.createdAt).getTime();
  const withinWindow = Date.now() - placedAt <= CANCEL_WINDOW_MS;
  const canCancel = withinWindow && order.status !== "shipped" && order.status !== "delivered" && order.status !== "cancelled";

  // Minutes remaining in cancel window
  const minutesLeft = Math.max(0, Math.ceil((CANCEL_WINDOW_MS - (Date.now() - placedAt)) / 60000));

  return (
    <main className="max-w-2xl mx-auto px-4 py-20">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-800 transition mb-8"
      >
        ← Back to orders
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="font-serif text-3xl mb-1"
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #d97706 40%, #92400e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-stone-400 text-sm">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span className={`text-sm font-medium px-3 py-1.5 rounded-full mt-1 ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Items */}
      <section className="border border-stone-200 rounded-2xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-medium text-stone-700">Items</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between px-6 py-4">
              <div>
                <Link
                  href={`/products/${item.productSlug}`}
                  className="text-sm font-medium text-stone-700 hover:text-amber-800 transition"
                >
                  {item.productName}
                </Link>
                <p className="text-xs text-stone-400 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm text-stone-600">
                ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center px-6 py-4 bg-stone-50 border-t border-stone-100">
          <span className="text-sm font-medium text-stone-700">Total</span>
          <span className="font-medium text-stone-800">
            ${(order.subtotalCents / 100).toFixed(2)}
          </span>
        </div>
      </section>

      {/* Shipping address (only show if we have one) */}
      {order.shippingAddress?.line1 && (
        <section className="border border-stone-200 rounded-2xl px-6 py-5 mb-6">
          <h2 className="font-medium text-stone-700 mb-3">Shipping Address</h2>
          <div className="text-sm text-stone-500 space-y-0.5">
            <p>{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </section>
      )}

      {/* Order status timeline */}
      {order.status !== "cancelled" && (
        <section className="border border-stone-200 rounded-2xl px-6 py-5 mb-6">
          <h2 className="font-medium text-stone-700 mb-4">Order Status</h2>
          <div className="flex items-center gap-2">
            {(["pending", "paid", "shipped", "delivered"] as const).map((step, i, arr) => {
              const stepOrder = ["pending", "paid", "shipped", "delivered"];
              const currentIndex = stepOrder.indexOf(order.status);
              const stepIndex = stepOrder.indexOf(step);
              const done = stepIndex <= currentIndex;
              const style = STATUS_STYLES[step];
              return (
                <div key={step} className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition ${
                        done ? style.className : "bg-stone-100 text-stone-300"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs ${done ? "text-stone-600" : "text-stone-300"} whitespace-nowrap`}>
                      {style.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mb-4 ${done && stepIndex < currentIndex ? "bg-amber-300" : "bg-stone-200"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {order.status === "cancelled" && (
        <div className="border border-red-100 bg-red-50 rounded-2xl px-6 py-4 mb-6">
          <p className="text-sm text-red-700 font-medium">This order has been cancelled.</p>
        </div>
      )}

      {/* Cancel option */}
      {canCancel && (
        <div className="border border-stone-200 rounded-2xl px-6 py-5">
          <h2 className="font-medium text-stone-700 mb-1">Need to cancel?</h2>
          <p className="text-sm text-stone-400">
            You can cancel this order for the next {minutesLeft} minute{minutesLeft !== 1 ? "s" : ""}.
            After that it will begin processing.
          </p>
          <CancelOrderButton orderId={order.id} />
        </div>
      )}
    </main>
  );
}
