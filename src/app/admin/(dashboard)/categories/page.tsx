import { db } from "@/lib/db";
import CategoryManager from "./CategoryManager";

export const dynamic = "force-dynamic";


export default async function AdminCategoriesPage() {
  const categories = await db.listCategories();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Categories</h1>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
