import { db } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";


export default async function NewProductPage() {
  const categories = await db.listCategories();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
