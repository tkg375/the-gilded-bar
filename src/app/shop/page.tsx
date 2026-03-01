import { db } from "@/lib/db";
import ProductGrid from "@/components/storefront/ProductGrid";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  soaps: "Soaps",
  shampoo: "Shampoo",
  scrubs: "Scrubs",
  "bath-bombs": "Bath Bombs",
  kids: "Kids",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;

  const products = await db.queryProducts({ activeOnly: true, category, search });

  const heading = search
    ? `Search: "${search}"`
    : category
    ? (CATEGORY_LABELS[category] ?? "Shop")
    : "Shop All";

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-serif text-4xl text-stone-800 mb-2">{heading}</h1>
      {search && (
        <p className="text-stone-500 text-sm mb-8">
          {products.length} {products.length === 1 ? "product" : "products"} found
        </p>
      )}
      <ProductGrid products={products} />
    </main>
  );
}
