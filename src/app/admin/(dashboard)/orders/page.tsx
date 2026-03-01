import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";


const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-stone-100 text-stone-500",
};

export default async function AdminOrdersPage() {
  const orders = await db.listOrders();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Orders</h1>
      {orders.length === 0 ? (
        <p className="text-stone-500 text-sm">No orders yet.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-mono text-xs text-stone-500">#{o.id.slice(0, 8)}</span>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[o.status] ?? ""}`}>
                    {o.status}
                  </span>
                </div>
                <p className="text-sm text-stone-700 truncate mb-1">{o.customerEmail || "—"}</p>
                <div className="flex items-center gap-4 text-xs text-stone-500 mb-3">
                  <span>${((o.subtotalCents ?? 0) / 100).toFixed(2)}</span>
                  <span>{o.items?.length ?? 0} item{(o.items?.length ?? 0) !== 1 ? "s" : ""}</span>
                  <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
                <Link href={`/admin/orders/${o.id}`} className="text-amber-700 text-sm font-medium hover:underline">
                  View order →
                </Link>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Items</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">{o.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-stone-700">{o.customerEmail}</td>
                    <td className="px-4 py-3 text-stone-600">{o.items?.length ?? 0}</td>
                    <td className="px-4 py-3 text-stone-600">${((o.subtotalCents ?? 0) / 100).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[o.status] ?? ""}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${o.id}`} className="text-amber-700 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
