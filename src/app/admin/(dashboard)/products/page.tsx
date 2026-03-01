import Link from "next/link";
import { db } from "@/lib/db";
import DeleteProductButton from "./DeleteProductButton";

export const dynamic = "force-dynamic";


export default async function AdminProductsPage() {
  const products = await db.listProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-stone-500 text-sm">No products yet.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-stone-800">{p.name}</span>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                    {p.active ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-stone-500 mb-3">
                  <span>${(p.price / 100).toFixed(2)}</span>
                  <span>{p.stock} in stock</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="text-amber-700 font-medium hover:underline">Edit</Link>
                  <DeleteProductButton id={p.id} name={p.name} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium text-stone-800">{p.name}</td>
                    <td className="px-4 py-3 text-stone-600">${(p.price / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-stone-600">{p.stock}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                        {p.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <Link href={`/admin/products/${p.id}`} className="text-amber-700 hover:underline">Edit</Link>
                      <DeleteProductButton id={p.id} name={p.name} />
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
