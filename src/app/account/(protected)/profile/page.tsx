"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { SavedAddress } from "@/lib/types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const EMPTY_ADDR = { name: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "US" };

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" });
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Shipping addresses state
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrMsg, setAddrMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/account/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.name !== undefined) setProfile({ name: d.name, email: d.email });
      })
      .catch(() => {});

    fetchAddresses();
  }, []);

  function fetchAddresses() {
    fetch("/api/account/addresses")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setAddresses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, email: profile.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: "error", text: data.error || "Update failed" });
      } else {
        setProfileMsg({ type: "success", text: "Profile updated successfully" });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (passwords.newPw !== passwords.confirm) {
      setPwMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMsg({ type: "error", text: data.error || "Update failed" });
      } else {
        setPwMsg({ type: "success", text: "Password changed successfully" });
        setPasswords({ current: "", newPw: "", confirm: "" });
      }
    } catch {
      setPwMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setPwLoading(false);
    }
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddrMsg(null);
    setAddrLoading(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addrForm, isDefault: addresses.length === 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddrMsg({ type: "error", text: data.error || "Failed to save address" });
      } else {
        setAddrForm(EMPTY_ADDR);
        setShowAddrForm(false);
        fetchAddresses();
      }
    } catch {
      setAddrMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setAddrLoading(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    fetchAddresses();
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "PATCH" });
    fetchAddresses();
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-20">
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
        Edit Profile
      </h1>
      <p className="text-stone-400 text-sm mb-10 tracking-wide uppercase">Your information</p>

      {/* Profile form */}
      <form onSubmit={handleProfileSubmit} className="space-y-5 mb-12">
        <h2 className="font-medium text-stone-700">Personal Details</h2>
        {profileMsg && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              profileMsg.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {profileMsg.text}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={profile.email}
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button
          type="submit"
          disabled={profileLoading}
          className="w-full bg-amber-800 hover:bg-amber-900 disabled:opacity-60 text-white font-medium py-3 rounded-full text-sm transition"
        >
          {profileLoading ? "Saving…" : "Save Changes"}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={handlePasswordSubmit} className="space-y-5 mb-14">
        <h2 className="font-medium text-stone-700">Change Password</h2>
        {pwMsg && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              pwMsg.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {pwMsg.text}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Current Password</label>
          <input
            type="password"
            required
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">New Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={passwords.newPw}
            onChange={(e) => setPasswords((p) => ({ ...p, newPw: e.target.value }))}
            className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={passwords.confirm}
            onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button
          type="submit"
          disabled={pwLoading}
          className="w-full bg-amber-800 hover:bg-amber-900 disabled:opacity-60 text-white font-medium py-3 rounded-full text-sm transition"
        >
          {pwLoading ? "Updating…" : "Change Password"}
        </button>
      </form>

      {/* Shipping addresses */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-medium text-stone-700">Shipping Addresses</h2>
          {!showAddrForm && (
            <button
              onClick={() => { setShowAddrForm(true); setAddrMsg(null); }}
              className="text-sm text-amber-800 hover:text-amber-900 font-medium transition"
            >
              + Add new
            </button>
          )}
        </div>

        {/* Saved addresses list */}
        {addresses.length > 0 && (
          <div className="space-y-3 mb-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`rounded-xl border px-4 py-3.5 text-sm ${
                  addr.isDefault ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-800">{addr.name}</p>
                    <p className="text-stone-500 mt-0.5">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
                    </p>
                    <p className="text-stone-500">
                      {addr.city}, {addr.state} {addr.postalCode} · {addr.country}
                    </p>
                    {addr.isDefault && (
                      <span className="inline-block mt-1.5 text-xs text-amber-700 font-medium">Default</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-xs text-stone-400 hover:text-amber-800 transition"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs text-stone-400 hover:text-red-600 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {addresses.length === 0 && !showAddrForm && (
          <p className="text-sm text-stone-400 mb-6">No saved addresses yet.</p>
        )}

        {/* Add address form */}
        {showAddrForm && (
          <form onSubmit={handleAddAddress} className="space-y-4 border border-stone-200 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-stone-700">New Address</h3>

            {addrMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm ${
                addrMsg.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                {addrMsg.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={addrForm.name}
                onChange={(e) => setAddrForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Address Line 1</label>
              <input
                type="text"
                required
                value={addrForm.line1}
                onChange={(e) => setAddrForm((f) => ({ ...f, line1: e.target.value }))}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Address Line 2 (optional)</label>
              <input
                type="text"
                value={addrForm.line2}
                onChange={(e) => setAddrForm((f) => ({ ...f, line2: e.target.value }))}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={addrForm.city}
                  onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">State</label>
                <select
                  required
                  value={addrForm.state}
                  onChange={(e) => setAddrForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="">Select…</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">ZIP Code</label>
                <input
                  type="text"
                  required
                  value={addrForm.postalCode}
                  onChange={(e) => setAddrForm((f) => ({ ...f, postalCode: e.target.value }))}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Country</label>
                <select
                  value={addrForm.country}
                  onChange={(e) => setAddrForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={addrLoading}
                className="flex-1 bg-amber-800 hover:bg-amber-900 disabled:opacity-60 text-white font-medium py-2.5 rounded-full text-sm transition"
              >
                {addrLoading ? "Saving…" : "Save Address"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddrForm(false); setAddrForm(EMPTY_ADDR); setAddrMsg(null); }}
                className="flex-1 border border-stone-300 text-stone-600 hover:bg-stone-50 font-medium py-2.5 rounded-full text-sm transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
