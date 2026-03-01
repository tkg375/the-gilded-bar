"use client";
import Link from "next/link";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/cart-context";

export const dynamic = "force-dynamic";

function SuccessContent() {
  const { clearCart } = useCart();
  const params = useSearchParams();

  const redirectStatus = params.get("redirect_status");
  const orderId = params.get("orderId");

  useEffect(() => {
    clearCart();

    // Verify payment with Stripe and update order status + decrement stock
    if (orderId) {
      fetch("/api/stripe/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      }).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stripe 3DS redirect returned a non-success status
  if (redirectStatus && redirectStatus !== "succeeded") {
    return (
      <main className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-6">⚠️</div>
        <h1 className="font-serif text-3xl text-stone-800 mb-3">Payment not completed</h1>
        <p className="text-stone-500 mb-8">
          Something went wrong. Your card was not charged.
        </p>
        <Link
          href="/checkout"
          className="inline-block bg-amber-800 hover:bg-amber-900 text-white font-medium px-6 py-2.5 rounded-full text-sm transition"
        >
          Try again
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">✨</div>
      <h1 className="font-serif text-3xl text-stone-800 mb-3">Thank you!</h1>
      <p className="text-stone-500 mb-2">
        Your order is confirmed. We&apos;ll get your soaps packed and on their way soon.
      </p>
      {orderId && (
        <p className="text-xs text-stone-400 mb-8 mt-1">
          Order #{orderId.slice(0, 8).toUpperCase()}
        </p>
      )}
      <div className="flex items-center justify-center gap-4">
        {orderId && (
          <Link
            href={`/account/orders/${orderId}`}
            className="inline-block border border-amber-800 text-amber-800 hover:bg-amber-50 font-medium px-6 py-2.5 rounded-full text-sm transition"
          >
            View order
          </Link>
        )}
        <Link
          href="/shop"
          className="inline-block bg-amber-800 hover:bg-amber-900 text-white font-medium px-6 py-2.5 rounded-full text-sm transition"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-stone-400 text-sm">Loading…</p>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
