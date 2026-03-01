"use client";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Opens the user's mail client with the message pre-filled
    const subject = encodeURIComponent(`Message from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:hello@thegildedbar.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-20">
      <h1 className="font-serif text-4xl mb-2" style={{
        background: "linear-gradient(135deg, #fbbf24 0%, #d97706 40%, #92400e 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        Get in Touch
      </h1>
      <p className="text-stone-400 text-sm mb-10 tracking-wide uppercase">We'd love to hear from you</p>

      {sent ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="font-serif text-xl text-amber-800 mb-2">Thank you!</p>
          <p className="text-stone-500 text-sm">Your mail client should have opened. We'll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Message</label>
            <textarea
              name="message"
              required
              rows={5}
              value={form.message}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-800 hover:bg-amber-900 text-white font-medium py-3 rounded-full text-sm transition"
          >
            Send Message
          </button>
        </form>
      )}

      <div className="mt-12 text-center text-sm text-stone-400 space-y-1">
        <p>Or reach us directly at</p>
        <a href="mailto:hello@thegildedbar.com" className="text-amber-800 hover:underline">
          hello@thegildedbar.com
        </a>
      </div>
    </main>
  );
}
