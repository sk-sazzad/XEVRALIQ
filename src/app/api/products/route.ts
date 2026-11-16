import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const statusFilter = searchParams.get("status");
  if (statusFilter && !["ACTIVE","INACTIVE"].includes(statusFilter))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    type ProductRow = {
      id: string; name: string; sku: string; category: string;
      price: number; salePrice: number | null; description: string | null;
      tags: string[]; status: string; imageUrls: string[];
      stock: number; trackStock: boolean; lowStockAlert: number;
      internalNote: string | null; attributes: unknown;
      createdAt: Date; updatedAt: Date;
      variantCount: bigint; totalStock: bigint;
    };

    const products = statusFilter
      ? await db.$queryRaw<ProductRow[]>`
          SELECT p.id, p.name, p.sku, p.category, p.price, p."salePrice", p.description,
                 p.tags, p.status, p."imageUrls", p.stock, p."trackStock", p."lowStockAlert",
                 p."internalNote", p.attributes, p."createdAt", p."updatedAt",
                 COUNT(pv.id)::bigint as "variantCount",
                 COALESCE(SUM(pv.stock), 0)::bigint as "totalStock"
          FROM products p
          LEFT JOIN product_variants pv ON pv."productId" = p.id
          WHERE p.status = ${statusFilter}::"ProductStatus"
          GROUP BY p.id
          ORDER BY p."createdAt" DESC
          LIMIT ${limit} OFFSET ${offset}`
      : await db.$queryRaw<ProductRow[]>`
          SELECT p.id, p.name, p.sku, p.category, p.price, p."salePrice", p.description,
                 p.tags, p.status, p."imageUrls", p.stock, p."trackStock", p."lowStockAlert",
                 p."internalNote", p.attributes, p."createdAt", p."updatedAt",
                 COUNT(pv.id)::bigint as "variantCount",
                 COALESCE(SUM(pv.stock), 0)::bigint as "totalStock"
          FROM products p
          LEFT JOIN product_variants pv ON pv."productId" = p.id
          GROUP BY p.id
          ORDER BY p."createdAt" DESC
          LIMIT ${limit} OFFSET ${offset}`;

    type CountRow = { count: bigint };
    const [totalRow] = statusFilter
      ? await db.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint as count FROM products WHERE status = ${statusFilter}::"ProductStatus"`
      : await db.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint as count FROM products`;

    type StatusCountRow = { status: string; count: bigint };
    const statusCounts = await db.$queryRaw<StatusCountRow[]>`
      SELECT status, COUNT(*)::bigint as count FROM products GROUP BY status`;
    const statusCountsMap: Record<string, number> = {};
    for (const r of statusCounts) statusCountsMap[r.status] = Number(r.count);

    const shaped = products.map(p => ({
      ...p,
      price: Number(p.price),
      salePrice: p.salePrice != null ? Number(p.salePrice) : null,
      stock: Number(p.stock),
      variantCount: Number(p.variantCount),
      totalStock: Number(p.totalStock),
    }));

    return NextResponse.json({ products: shaped, total: Number(totalRow.count), page, limit, statusCounts: statusCountsMap });
  } catch (err) {
    console.error("Products GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    name, sku, category, price, salePrice, description, tags,
    status, imageUrls, stock, trackStock, lowStockAlert,
    internalNote, attributes, variants,
  } = body;

  if (!name || !sku || !category || price == null) {
    return NextResponse.json({ error: "name, sku, category, price are required" }, { status: 400 });
  }

  try {
    const tagsArr = Array.isArray(tags) ? tags : [];
    const imageUrlsArr = Array.isArray(imageUrls) ? imageUrls : [];
    const attrsJson = attributes ? JSON.stringify(attributes) : null;

    type InsertRow = { id: string };
    const [row] = await db.$queryRaw<InsertRow[]>`
      INSERT INTO products (
        id, name, sku, category, price, "salePrice", description,
        tags, status, "imageUrls", stock, "trackStock", "lowStockAlert",
        "internalNote", attributes, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${name}, ${sku}, ${category}, ${price}::float,
        ${salePrice ?? null}::float, ${description ?? null},
        ${tagsArr}::text[], ${status ?? "ACTIVE"}::"ProductStatus",
        ${imageUrlsArr}::text[], ${stock ?? 0}::int,
        ${trackStock ?? true}::boolean, ${lowStockAlert ?? 5}::int,
        ${internalNote ?? null}, ${attrsJson}::jsonb,
        NOW(), NOW()
      )
      RETURNING id`;

    const productId = row.id;

    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        await db.$queryRaw`
          INSERT INTO product_variants (
            id, "productId", attributes, sku, price, stock, status, "imageUrl", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text,
            ${productId},
            ${JSON.stringify(v.attributes)}::jsonb,
            ${v.sku}, ${Number(v.price)}::float,
            ${Number(v.stock)}::int,
            ${v.status ?? "ACTIVE"}::"ProductStatus",
            ${v.imageUrl ?? null},
            NOW(), NOW()
          )`;
      }
    }

    return NextResponse.json({ id: productId, name, sku }, { status: 201 });
  } catch (err) {
    console.error("Products POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await db.$queryRaw`DELETE FROM products WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
