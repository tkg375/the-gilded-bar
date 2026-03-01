"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function handleCancel() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/account/orders/${orderId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to cancel order");
      setLoading(false);
      setConfirming(false);
    } else {
      router.refresh();
    }
  }

  if (error) {
    return <p className="text-sm text-red-600 mt-4">{error}</p>;
  }

  if (confirming) {
    return (
      <div className="mt-6 flex items-center gap-3">
        <p className="text-sm text-stone-600">Are you sure you want to cancel this order?</p>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 rounded-full transition"
        >
          {loading ? "Cancelling…" : "Yes, cancel it"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-stone-500 hover:text-stone-700 transition"
        >
          Never mind
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="mt-6 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 hover:border-red-300 px-4 py-2 rounded-full transition"
    >
      Cancel order
    </button>
  );
}
