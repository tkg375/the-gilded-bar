"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders",     label: "Orders" },
];

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="flex flex-col h-full w-56 bg-white border-r border-stone-200">
      <div className="px-5 py-5 border-b border-stone-100 flex items-center justify-between">
        <div>
          <p className="font-semibold text-amber-800 text-sm tracking-wide">Georgia Suds</p>
          <p className="text-xs text-stone-400 mt-0.5">Admin</p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className="text-stone-400 hover:text-stone-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="px-3 pt-3">
        <Link
          href="/admin/products"
          onClick={onClose}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium bg-amber-800 text-white hover:bg-amber-900 transition"
        >
          Products
          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition ${
                active ? "bg-amber-50 text-amber-800 font-medium" : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-stone-100">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-stone-500 hover:text-red-600 hover:bg-red-50 transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-56 z-30">
        <SidebarInner />
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-stone-200 flex items-center px-4 gap-3">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-stone-500 hover:text-amber-800 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <p className="font-semibold text-amber-800 text-sm tracking-wide">Georgia Suds — Admin</p>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-50">
            <SidebarInner onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
