"use client";
import { useState } from "react";
import type { Category } from "@/lib/types";

export default function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  function autoSlug(n: string) {
    return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: autoSlug(name) }),
    });
    if (res.ok) {
      const { category } = await res.json();
      setCategories((c) => [...c, category]);
      setName("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    setCategories((c) => c.filter((cat) => cat.id !== id));
  }

  return (
    <div className="max-w-md space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
        >
          Add
        </button>
      </form>

      <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
        {categories.length === 0 && (
          <p className="text-stone-500 text-sm px-4 py-3">No categories yet.</p>
        )}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-stone-800">{c.name}</p>
              <p className="text-xs text-stone-400">{c.slug}</p>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-xs text-red-500 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
