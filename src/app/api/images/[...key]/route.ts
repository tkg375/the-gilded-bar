import { NextRequest, NextResponse } from "next/server";
import { getImagesBucket } from "@/lib/db";


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const objectKey = key.join("/");

  const bucket = await getImagesBucket();
  const object = await bucket.get(objectKey);

  if (!object) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
