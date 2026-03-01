import Link from "next/link";
import Image from "next/image";
import type { Product, ProductTag } from "@/lib/types";
import AddToCartButton from "./AddToCartButton";

const TAG_STYLES: Record<ProductTag, { label: string; className: string }> = {
  new:       { label: "New",       className: "bg-emerald-500 text-white" },
  sale:      { label: "Sale",      className: "bg-red-500 text-white" },
  clearance: { label: "Clearance", className: "bg-amber-500 text-white" },
};

// Priority order for display: sale → clearance → new
const TAG_PRIORITY: ProductTag[] = ["sale", "clearance", "new"];

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  const isComingSoon = product.comingSoon && (!product.availableAt || new Date() < new Date(product.availableAt));
  const activeTag = isComingSoon ? null : TAG_PRIORITY.find((t) => product.tags?.includes(t));

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/products/${product.slug}`} className="relative aspect-square bg-stone-100 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-4xl">🧼</div>
        )}

        {/* Tag badge */}
        {isComingSoon ? (
          <span className="absolute top-2.5 left-2.5 text-xs font-semibold px-2.5 py-1 rounded-md tracking-wide bg-indigo-600 text-white">
            Coming Soon
          </span>
        ) : activeTag && (
          <span className={`absolute top-2.5 left-2.5 text-xs font-semibold px-2.5 py-1 rounded-md tracking-wide ${TAG_STYLES[activeTag].className}`}>
            {TAG_STYLES[activeTag].label}
          </span>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-medium text-peach-500 tracking-wide">Sold out</span>
          </div>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-peach-800 hover:text-peach-600 transition">{product.name}</h3>
        </Link>
        <p className="text-sm text-peach-500 line-clamp-2 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="font-semibold text-peach-800">${(product.price / 100).toFixed(2)}</span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
