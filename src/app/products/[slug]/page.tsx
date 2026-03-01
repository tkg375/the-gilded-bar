import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import AddToCartButton from "@/components/storefront/AddToCartButton";

export const dynamic = "force-dynamic";


export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const products = await db.queryProducts({ activeOnly: true });
  const product = products.find((p) => p.slug === slug);

  if (!product) notFound();

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          {product.images?.length > 0 ? (
            <>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100">
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              </div>
              {product.images.slice(1).length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {product.images.slice(1).map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
                      <Image src={img} alt={`${product.name} ${i + 2}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square rounded-2xl bg-stone-100 flex items-center justify-center text-stone-300 text-8xl">🧼</div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="font-serif text-4xl text-stone-900 mb-2">{product.name}</h1>
          <p className="text-2xl font-semibold text-stone-800 mb-6">${(product.price / 100).toFixed(2)}</p>
          <p className="text-stone-600 leading-relaxed mb-8">{product.description}</p>
          <div className="mb-4">
            {(() => {
              const isComingSoon = product.comingSoon && (!product.availableAt || new Date() < new Date(product.availableAt));
              if (isComingSoon) {
                return (
                  <div className="space-y-2">
                    <span className="inline-block bg-indigo-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full">Coming Soon</span>
                    {product.availableAt && (
                      <p className="text-sm text-stone-500">
                        Available {new Date(product.availableAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                );
              }
              return (
                <>
                  {product.stock > 0 ? (
                    <p className="text-sm text-green-600 mb-4">{product.stock} in stock</p>
                  ) : (
                    <p className="text-sm text-red-500 mb-4">Out of stock</p>
                  )}
                  <AddToCartButton product={product} />
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </main>
  );
}
