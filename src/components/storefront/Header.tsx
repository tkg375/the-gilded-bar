"use client";
import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import GildedBarLogo from "@/components/GildedBarLogo";

export default function Header() {
  const { itemCount } = useCart();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/account/me")
      .then((r) => { if (r.ok) setLoggedIn(true); })
      .catch(() => {});
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q) router.push(`/shop?search=${encodeURIComponent(q)}`);
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 border-b border-stone-200">

      {/* ── Top row ─────────────────────────────────────────────────────── */}
      <div className="bg-peach-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center gap-3 sm:gap-6">

          {/* Logo — icon only on mobile, icon + text on desktop */}
          <Link href="/" aria-label="Georgia Suds — Home" className="shrink-0">
            <span className="hidden sm:block"><GildedBarLogo size={40} id="hdr" /></span>
            <span className="sm:hidden"><GildedBarLogo size={36} showText={false} id="hdr-m" /></span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search soaps…"
                className="w-full bg-white border border-stone-300 rounded-full pl-4 sm:pl-5 pr-10 py-2 sm:py-2.5 text-sm text-peach-800 placeholder:text-peach-400 focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15 transition"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-peach-400 hover:text-peach-800 transition"
                aria-label="Search"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Mobile: cart icon only */}
          <Link href="/cart" className="relative sm:hidden text-peach-600 p-1" aria-label="Cart">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-700 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold leading-none">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Desktop: full icon nav */}
          <nav className="hidden sm:flex items-center gap-1 shrink-0" style={{ fontFamily: "var(--font-bubble)" }}>

            {loggedIn ? (
              <>
                <Link href="/account" className="flex flex-col items-center gap-0.5 px-4 py-2 text-peach-600 hover:text-peach-800 transition group">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span className="text-sm leading-none">Profile</span>
                </Link>
                <Link href="/account/orders" className="flex flex-col items-center gap-0.5 px-4 py-2 text-peach-600 hover:text-peach-800 transition group">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
                  </svg>
                  <span className="text-sm leading-none">Orders</span>
                </Link>
              </>
            ) : (
              <Link href="/account/login" className="flex flex-col items-center gap-0.5 px-4 py-2 text-peach-600 hover:text-peach-800 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span className="text-sm leading-none">Log in</span>
              </Link>
            )}

            <Link href="/cart" className="flex flex-col items-center gap-0.5 px-4 py-2 text-peach-600 hover:text-peach-800 transition relative">
              <span className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-700 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold leading-none">
                    {itemCount}
                  </span>
                )}
              </span>
              <span className="text-sm leading-none">Cart</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* ── Bottom row: category nav ─────────────────────────────────────── */}
      <div className="bg-white border-t border-stone-100 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <nav
          className="flex items-center gap-5 sm:gap-8 sm:justify-center px-4 sm:px-6 h-10 sm:h-12 text-peach-600"
          style={{ fontFamily: "var(--font-bubble)", width: "max-content", minWidth: "100%" }}
        >
          <Link href="/shop?category=soaps"      className="hover:text-peach-800 transition text-base sm:text-xl whitespace-nowrap">Soaps</Link>
          <Link href="/shop?category=shampoo"    className="hover:text-peach-800 transition text-base sm:text-xl whitespace-nowrap">Shampoo</Link>
          <Link href="/shop?category=scrubs"     className="hover:text-peach-800 transition text-base sm:text-xl whitespace-nowrap">Scrubs</Link>
          <Link href="/shop?category=bath-bombs" className="hover:text-peach-800 transition text-base sm:text-xl whitespace-nowrap">Bath Bombs</Link>
          <Link href="/shop?category=kids"       className="hover:text-peach-800 transition text-base sm:text-xl whitespace-nowrap">Kids</Link>
          <Link href="/shop"                     className="hover:text-peach-800 transition text-base sm:text-xl whitespace-nowrap">Shop All</Link>
        </nav>
      </div>

    </header>
  );
}
