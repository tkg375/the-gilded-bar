"use client";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/types";

export default function CategoryFilter({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "";

  function select(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => select("")}
        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
          !active
            ? "bg-amber-800 text-white border-amber-800"
            : "border-stone-300 text-peach-600 hover:border-amber-500"
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => select(c.slug)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
            active === c.slug
              ? "bg-amber-800 text-white border-amber-800"
              : "border-stone-300 text-peach-600 hover:border-amber-500"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
