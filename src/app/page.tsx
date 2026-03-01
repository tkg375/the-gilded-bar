import { db } from "@/lib/db";
import Hero from "@/components/storefront/Hero";
import ProductGrid from "@/components/storefront/ProductGrid";
import Link from "next/link";

export const dynamic = "force-dynamic";


export default async function HomePage() {
  const products = await db.queryProducts({ activeOnly: true, limit: 6 });

  return (
    <main>
      <Hero />
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-3xl text-stone-800">Featured soaps</h2>
          <Link href="/shop" className="text-sm text-amber-800 hover:underline">View all →</Link>
        </div>
        <ProductGrid products={products} />
      </section>
    </main>
  );
}
