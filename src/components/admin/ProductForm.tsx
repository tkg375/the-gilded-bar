"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";
import type { Product, ProductTag, Category } from "@/lib/types";

const ALL_TAGS: { value: ProductTag; label: string }[] = [
  { value: "new",       label: "New"       },
  { value: "sale",      label: "Sale"      },
  { value: "clearance", label: "Clearance" },
];

interface Props {
  product?: Product;
  categories: Category[];
}

export default function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product ? (product.price / 100).toFixed(2) : "",
    stock: product?.stock?.toString() ?? "",
    category: product?.category ?? "",
    active: product?.active ?? true,
    tags: product?.tags ?? [] as ProductTag[],
    comingSoon: product?.comingSoon ?? false,
    availableAt: product?.availableAt ?? "",
    images: product?.images ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      price: Math.round(parseFloat(form.price) * 100),
      stock: parseInt(form.stock, 10),
    };
    const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
          <input
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!isEdit) set("slug", autoSlug(e.target.value));
            }}
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-stone-700 mb-1">Slug</label>
          <input
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Stock</label>
          <input
            type="number"
            min="0"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={form.stock}
            onChange={(e) => set("stock", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
          <select
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="active"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
            className="rounded"
          />
          <label htmlFor="active" className="text-sm text-stone-700">Active (visible in store)</label>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-stone-700 mb-2">Product Tags</label>
          <div className="flex items-center gap-5">
            {ALL_TAGS.map(({ value, label }) => {
              const checked = (form.tags as ProductTag[]).includes(value);
              return (
                <label key={value} className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...(form.tags as ProductTag[]), value]
                        : (form.tags as ProductTag[]).filter((t) => t !== value);
                      set("tags", next);
                    }}
                    className="rounded"
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>

        {/* Coming Soon */}
        <div className="col-span-2 border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              id="comingSoon"
              checked={form.comingSoon}
              onChange={(e) => {
                set("comingSoon", e.target.checked);
                if (!e.target.checked) set("availableAt", "");
              }}
              className="rounded"
            />
            <span className="text-sm font-medium text-stone-700">Coming Soon <span className="font-normal text-stone-500">(disables purchase until live)</span></span>
          </label>
          {form.comingSoon && (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Go Live Date &amp; Time <span className="text-stone-400">(optional — leave blank to stay coming soon until manually changed)</span></label>
              <input
                type="datetime-local"
                value={form.availableAt ?? ""}
                onChange={(e) => set("availableAt", e.target.value || "")}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
              {form.availableAt && (
                <p className="text-xs text-amber-700 mt-1">Product will automatically become purchasable at this date and time.</p>
              )}
            </div>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            rows={5}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-stone-700 mb-2">Images</label>
          <ImageUploader images={form.images} onChange={(imgs) => set("images", imgs)} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-700 hover:bg-amber-800 text-white font-medium px-5 py-2 rounded-lg text-sm transition disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
