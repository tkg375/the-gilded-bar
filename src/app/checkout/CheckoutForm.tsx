"use client";
import { useState, useEffect, FormEvent } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import type { SavedAddress } from "@/lib/types";

interface Props {
  orderId: string;
  totalCents: number;
  defaultEmail?: string;
  defaultName?: string;
  savedAddresses?: SavedAddress[];
}

export default function CheckoutForm({
  orderId,
  totalCents,
  defaultEmail = "",
  defaultName = "",
  savedAddresses = [],
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAddrId, setSelectedAddrId] = useState<string>("new");

  // Sync when account data arrives after initial render
  useEffect(() => { if (defaultEmail) setEmail(defaultEmail); }, [defaultEmail]);

  // Pre-select default address if one exists
  useEffect(() => {
    if (savedAddresses.length > 0) {
      const def = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
      setSelectedAddrId(def.id);
    }
  }, [savedAddresses]);

  const selectedAddr = savedAddresses.find((a) => a.id === selectedAddrId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please check your details.");
      setLoading(false);
      return;
    }

    // Build shipping param — prefer saved address if selected, otherwise read AddressElement
    let shippingParam: Parameters<typeof stripe.confirmPayment>[0]["confirmParams"]["shipping"] = undefined;

    if (selectedAddr && selectedAddrId !== "new") {
      shippingParam = {
        name: selectedAddr.name,
        address: {
          line1: selectedAddr.line1,
          line2: selectedAddr.line2 ?? "",
          city: selectedAddr.city,
          state: selectedAddr.state,
          postal_code: selectedAddr.postalCode,
          country: selectedAddr.country,
        },
      };
    } else {
      const addressElement = elements.getElement("address");
      if (addressElement) {
        const { value } = await addressElement.getValue();
        shippingParam = {
          name: value.name,
          address: {
            line1: value.address.line1,
            line2: value.address.line2 ?? "",
            city: value.address.city,
            state: value.address.state,
            postal_code: value.address.postal_code,
            country: value.address.country,
          },
        };
      }
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${appUrl}/checkout/success`,
        payment_method_data: { billing_details: { email } },
        shipping: shippingParam,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/checkout/success?orderId=${orderId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">

      {/* Contact */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2.5">
          Contact
        </p>
        <input
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition"
        />
      </div>

      {/* Shipping */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2.5">
          Shipping Address
        </p>

        {/* Saved address picker */}
        {savedAddresses.length > 0 && (
          <div className="mb-4">
            <select
              value={selectedAddrId}
              onChange={(e) => setSelectedAddrId(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition bg-white"
            >
              {savedAddresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.name} — {addr.line1}, {addr.city}{addr.isDefault ? " (Default)" : ""}
                </option>
              ))}
              <option value="new">Enter a new address…</option>
            </select>

            {/* Show selected saved address summary */}
            {selectedAddr && selectedAddrId !== "new" && (
              <div className="mt-2 px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl text-sm text-stone-600">
                <p className="font-medium text-stone-800">{selectedAddr.name}</p>
                <p>{selectedAddr.line1}{selectedAddr.line2 ? `, ${selectedAddr.line2}` : ""}</p>
                <p>{selectedAddr.city}, {selectedAddr.state} {selectedAddr.postalCode} · {selectedAddr.country}</p>
              </div>
            )}
          </div>
        )}

        {/* AddressElement — shown when entering a new address */}
        {(savedAddresses.length === 0 || selectedAddrId === "new") && (
          <AddressElement
            key={selectedAddrId}
            options={{
              mode: "shipping",
              allowedCountries: ["US", "CA", "GB", "AU"],
              fields: { phone: "never" },
              ...(defaultName ? { defaultValues: { name: defaultName } } : {}),
            }}
          />
        )}
      </div>

      {/* Payment */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2.5">
          Payment
        </p>
        <PaymentElement options={{ layout: "accordion" }} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="w-full bg-amber-900 hover:bg-amber-950 disabled:opacity-50 text-white font-medium py-4 rounded-xl transition text-sm tracking-wide"
      >
        {loading ? "Processing…" : `Pay $${(totalCents / 100).toFixed(2)}`}
      </button>

      <p className="text-xs text-center text-stone-300 flex items-center justify-center gap-1.5">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Secured by Stripe · Card details never stored
      </p>
    </form>
  );
}
