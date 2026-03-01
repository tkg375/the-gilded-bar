"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/context/cart-context";
import GildedBarLogo from "@/components/GildedBarLogo";
import CheckoutForm from "./CheckoutForm";
import type { SavedAddress } from "@/lib/types";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const { items, totalCents, hydrated } = useCart();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [initError, setInitError] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (hydrated && items.length === 0) router.replace("/cart");
  }, [hydrated, items, router]);

  // Pre-fill from logged-in account if available
  useEffect(() => {
    fetch("/api/account/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.email) setCustomerEmail(data.email);
        if (data?.name) setCustomerName(data.name);
      })
      .catch(() => {});

    fetch("/api/account/addresses")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setSavedAddresses(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    fetch("/api/stripe/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setInitError(data.error);
        else { setClientSecret(data.clientSecret); setOrderId(data.orderId); }
      })
      .catch(() => setInitError("Could not start checkout. Please try again."));
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated || (hydrated && items.length === 0)) {
    return <div className="min-h-screen bg-stone-50" />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel: brand + order summary ──────────────────────────── */}
      <div className="lg:w-[42%] shrink-0 bg-gradient-to-br from-amber-900 via-amber-950 to-stone-900 flex flex-col px-10 py-12 lg:px-14">

        {/* Logo + back link */}
        <div className="mb-12">
          <Link href="/cart" className="inline-flex items-center gap-1.5 text-amber-300/60 hover:text-amber-300 text-sm transition mb-8">
            ← Back to cart
          </Link>
          <GildedBarLogo size={38} id="co" showText={false} />
          <p className="font-serif text-white text-xl mt-3 tracking-wide">Georgia Suds</p>
          <p className="text-amber-300/50 text-xs mt-1 tracking-wider uppercase">Secure Checkout</p>
        </div>

        {/* Order items */}
        <div className="flex-1">
          <p className="text-xs font-semibold text-amber-300/50 uppercase tracking-widest mb-5">
            Your Order
          </p>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-amber-800/30 shrink-0 ring-1 ring-amber-700/30">
                  {item.image
                    ? <Image src={item.image} alt={item.name} fill className="object-cover" />
                    : <span className="flex items-center justify-center h-full text-xl">🧼</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-amber-300/50 mt-0.5">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-medium text-amber-200 shrink-0">
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-8 pt-6 border-t border-amber-800/40 space-y-2.5">
            <div className="flex justify-between text-sm text-amber-300/60">
              <span>Subtotal</span>
              <span>${(totalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-amber-300/40">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-white pt-2 border-t border-amber-800/40">
              <span>Total</span>
              <span>${(totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-amber-300/25 text-xs mt-12 italic leading-relaxed">
          Handcrafted in small batches with natural ingredients.
        </p>
      </div>

      {/* ── Right panel: form ───────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col justify-center px-8 py-12 lg:px-16 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <h1 className="font-serif text-3xl text-stone-800 mb-2">Complete your order</h1>
          <p className="text-stone-400 text-sm mb-10">Fill in your details below to finish your purchase.</p>

          {initError ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-600 mb-6">
              {initError}{" "}
              <Link href="/cart" className="underline">Back to cart</Link>
            </div>
          ) : clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#92400e",
                    colorBackground: "#ffffff",
                    colorText: "#1c1917",
                    colorDanger: "#dc2626",
                    colorTextSecondary: "#78716c",
                    borderRadius: "10px",
                    fontSizeBase: "14px",
                    spacingUnit: "5px",
                  },
                  rules: {
                    ".Input": {
                      border: "1px solid #e7e5e4",
                      boxShadow: "none",
                      padding: "10px 14px",
                    },
                    ".Input:focus": {
                      border: "1px solid #92400e",
                      boxShadow: "0 0 0 3px rgba(146,64,14,0.12)",
                    },
                    ".Label": {
                      color: "#57534e",
                      fontWeight: "500",
                      fontSize: "12px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    },
                    ".Tab": { border: "1px solid #e7e5e4", boxShadow: "none" },
                    ".Tab:hover": { border: "1px solid #d6d3d1" },
                    ".Tab--selected": { border: "1px solid #92400e", boxShadow: "0 0 0 2px rgba(146,64,14,0.15)" },
                  },
                },
              }}
            >
              <CheckoutForm
                orderId={orderId!}
                totalCents={totalCents}
                defaultEmail={customerEmail}
                defaultName={customerName}
                savedAddresses={savedAddresses}
              />
            </Elements>
          ) : (
            <div className="space-y-4 animate-pulse">
              <div className="h-5 w-20 bg-stone-100 rounded-lg" />
              <div className="h-11 bg-stone-100 rounded-xl" />
              <div className="h-5 w-28 bg-stone-100 rounded-lg mt-2" />
              <div className="h-32 bg-stone-100 rounded-xl" />
              <div className="h-5 w-20 bg-stone-100 rounded-lg mt-2" />
              <div className="h-28 bg-stone-100 rounded-xl" />
              <div className="h-12 bg-amber-50 rounded-xl mt-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
