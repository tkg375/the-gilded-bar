import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const featured = searchParams.get("featured") === "true";
  const limit = parseInt(searchParams.get("limit") ?? "0", 10);

  const [products, categories] = await Promise.all([
    db.queryProducts({
      activeOnly: true,
      category,
      limit: featured ? 6 : limit || undefined,
    }),
    db.listCategories(),
  ]);

  return NextResponse.json({ products, categories });
}
