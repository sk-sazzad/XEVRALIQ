import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;

  type ProductRow = {
    id: string; name: string; sku: string; category: string;
    price: number; salePrice: number | null; description: string | null;
    tags: string[]; status: string; imageUrls: string[];
    stock: number; trackStock: boolean; lowStockAlert: number;
    internalNote: string | null; attributes: unknown;
    createdAt: Date; updatedAt: Date;
  };

  const rows = await db.$queryRaw<ProductRow[]>`
    SELECT id, name, sku, category, price, "salePrice", description,
           tags, status, "imageUrls", stock, "trackStock", "lowStockAlert",
           "internalNote", attributes, "createdAt", "updatedAt"
    FROM products WHERE id = ${productId}`;

  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = rows[0];

  type VariantRow = {
    id: string; attributes: unknown; sku: string;
    price: number; stock: number; status: string; imageUrl: string | null;
  };
  const variants = await db.$queryRaw<VariantRow[]>`
    SELECT id, attributes, sku, price::float AS price, stock::int AS stock, status, "imageUrl"
    FROM product_variants WHERE "productId" = ${productId} ORDER BY "createdAt" ASC`;

  return NextResponse.json({
    ...p,
    price: Number(p.price),
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
    stock: Number(p.stock),
    variants,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  const body = await request.json();
  const {
    name, sku, category, price, salePrice, description, tags,
    status, imageUrls, stock, trackStock, lowStockAlert, internalNote,
  } = body;

  const tagsArr = Array.isArray(tags) ? tags : [];
  const imageUrlsArr = Array.isArray(imageUrls) ? imageUrls : [];

  try {
    await db.$queryRaw`
      UPDATE products SET
        name = ${name},
        sku = ${sku},
        category = ${category},
        price = ${Number(price)}::float,
        "salePrice" = ${salePrice != null ? Number(salePrice) : null}::float,
        description = ${description ?? null},
        tags = ${tagsArr}::text[],
        status = ${status}::"ProductStatus",
        "imageUrls" = ${imageUrlsArr}::text[],
        stock = ${Number(stock) || 0}::int,
        "trackStock" = ${trackStock ?? true}::boolean,
        "lowStockAlert" = ${Number(lowStockAlert) || 5}::int,
        "internalNote" = ${internalNote ?? null},
        "updatedAt" = NOW()
      WHERE id = ${productId}`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Products PATCH error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
