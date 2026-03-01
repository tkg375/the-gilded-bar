import Link from "next/link";
import GildedBarLogo from "@/components/GildedBarLogo";

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 py-12 mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <GildedBarLogo size={32} id="ftr" />
            <p className="text-sm text-peach-400">Handcrafted soaps, made with care.</p>
          </div>

          {/* Links */}
          <div className="flex gap-12 text-sm text-peach-500">
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-peach-700 text-xs uppercase tracking-widest mb-1">Company</p>
              <Link href="/about"   className="hover:text-peach-800 transition">About Us</Link>
              <Link href="/contact" className="hover:text-peach-800 transition">Contact</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-peach-700 text-xs uppercase tracking-widest mb-1">Shop</p>
              <Link href="/shop?category=soaps"      className="hover:text-peach-800 transition">Soaps</Link>
              <Link href="/shop?category=shampoo"    className="hover:text-peach-800 transition">Shampoo</Link>
              <Link href="/shop?category=scrubs"     className="hover:text-peach-800 transition">Scrubs</Link>
              <Link href="/shop?category=bath-bombs" className="hover:text-peach-800 transition">Bath Bombs</Link>
              <Link href="/shop?category=kids"       className="hover:text-peach-800 transition">Kids</Link>
              <Link href="/shop"                     className="hover:text-peach-800 transition">Shop All</Link>
            </div>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-stone-100 flex items-center justify-between text-xs text-peach-300">
          <p>© {new Date().getFullYear()} Georgia Suds. All rights reserved.</p>
          <a href="/admin" className="hover:text-peach-500 transition">Admin</a>
        </div>
      </div>
    </footer>
  );
}
