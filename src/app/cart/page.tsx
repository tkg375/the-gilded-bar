"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalCents, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-xl font-serif text-stone-700 mb-4">Your cart is empty</p>
        <Link href="/shop" className="text-sm text-amber-800 hover:underline">
          Browse soaps →
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-serif text-2xl text-stone-800 mb-8">Your cart</h1>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* ── Left: product list ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
            Items
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 bg-white border border-stone-100 rounded-2xl p-4"
              >
                {/* Image */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <span className="flex items-center justify-center h-full text-2xl">🧼</span>
                  )}
                </div>

                {/* Name + unit price */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 truncate">{item.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">${(item.price / 100).toFixed(2)} each</p>
                </div>

                {/* Qty stepper */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition"
                  >
                    +
                  </button>
                </div>

                {/* Line total */}
                <p className="font-medium text-stone-700 w-16 text-right shrink-0 text-sm">
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </p>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-stone-300 hover:text-red-400 transition text-lg ml-1 shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: order summary ───────────────────────────────────────── */}
        <div className="lg:w-[420px] shrink-0 w-full sticky top-24">
          <div className="bg-stone-50 border border-stone-100 rounded-2xl px-6 py-5 space-y-2.5">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Order Summary
            </h2>
            <div className="flex justify-between text-sm text-stone-500">
              <span>Subtotal</span>
              <span>${(totalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-400">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="border-t border-stone-200 pt-2.5 flex justify-between font-semibold text-stone-800">
              <span>Total</span>
              <span>${(totalCents / 100).toFixed(2)}</span>
            </div>
            <div className="pt-1 space-y-2">
              <Link
                href="/checkout"
                className="w-full bg-amber-800 hover:bg-amber-900 text-white font-medium py-3 rounded-xl transition text-sm text-center block"
              >
                Proceed to checkout
              </Link>
              <button
                onClick={clearCart}
                className="w-full text-xs text-stone-400 hover:text-red-400 transition py-1"
              >
                Clear cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
