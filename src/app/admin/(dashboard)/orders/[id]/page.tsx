import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";
import OrderStatusUpdater from "./OrderStatusUpdater";

export const dynamic = "force-dynamic";


export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.getOrder(id);
  if (!order) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Order</h1>
        <p className="text-sm text-stone-400 font-mono mt-1">{order.id}</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-stone-500">Customer</p>
            <p className="font-medium text-stone-800">{order.customerEmail}</p>
          </div>
          <div>
            <p className="text-stone-500">Date</p>
            <p className="font-medium text-stone-800">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-stone-500">Total</p>
            <p className="font-medium text-stone-800">${((order.subtotalCents ?? 0) / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-stone-500">Stripe Payment Intent</p>
            <p className="font-mono text-xs text-stone-600 break-all">{order.stripePaymentIntentId}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">Items</h2>
        <div className="space-y-2">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-stone-700">{item.productName} × {item.quantity}</span>
              <span className="text-stone-600">${((item.unitPrice * item.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {order.shippingAddress && (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-sm font-semibold text-stone-700 mb-2">Ship to</h2>
          <address className="text-sm text-stone-600 not-italic">
            <p>{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </address>
        </div>
      )}

      <OrderStatusUpdater orderId={order.id} currentStatus={order.status as OrderStatus} />
    </div>
  );
}
