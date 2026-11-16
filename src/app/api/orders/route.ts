import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const statusFilter = searchParams.get("status");
  const VALID_STATUSES = ["PENDING","CONFIRMED","DELIVERED","CANCELLED","RETURN","PAID_RETURN","EXCHANGE","STOCK_OUT","PRE_ORDER"];
  if (statusFilter && !VALID_STATUSES.includes(statusFilter))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    // Raw SQL to avoid stale Prisma client issue
    type OrderRow = {
      id: string; orderId: string; items: string; total: number;
      status: string; note: string | null; createdAt: Date; updatedAt: Date;
      conversationId: string;
      customerName: string | null; customerPic: string | null; customerPhone: string | null;
      platform: string; pageName: string;
    };

    const orders = statusFilter
      ? await db.$queryRaw<OrderRow[]>`
          SELECT o.id, o."orderId", o.items, o.total, o.status, o.note, o."createdAt", o."updatedAt", o."conversationId",
                 c."customerName", c."customerPic", c."customerPhone",
                 ca.platform, ca."pageName"
          FROM orders o
          JOIN conversations c ON c.id = o."conversationId"
          JOIN connected_accounts ca ON ca.id = c."accountId"
          WHERE o.status = ${statusFilter}::"OrderStatus"
          ORDER BY o."createdAt" DESC
          LIMIT ${limit} OFFSET ${offset}`
      : await db.$queryRaw<OrderRow[]>`
          SELECT o.id, o."orderId", o.items, o.total, o.status, o.note, o."createdAt", o."updatedAt", o."conversationId",
                 c."customerName", c."customerPic", c."customerPhone",
                 ca.platform, ca."pageName"
          FROM orders o
          JOIN conversations c ON c.id = o."conversationId"
          JOIN connected_accounts ca ON ca.id = c."accountId"
          ORDER BY o."createdAt" DESC
          LIMIT ${limit} OFFSET ${offset}`;

    type CountRow = { count: bigint };
    const [totalRow] = statusFilter
      ? await db.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint as count FROM orders WHERE status = ${statusFilter}::"OrderStatus"`
      : await db.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint as count FROM orders`;

    type StatusCountRow = { status: string; count: bigint };
    const statusCounts = await db.$queryRaw<StatusCountRow[]>`
      SELECT status, COUNT(*)::bigint as count FROM orders GROUP BY status`;

    const statusCountsMap: Record<string, number> = {};
    for (const r of statusCounts) {
      statusCountsMap[r.status] = Number(r.count);
    }

    // Reshape orders to match the expected format
    const shaped = orders.map(o => ({
      id: o.id,
      orderId: o.orderId,
      items: o.items,
      total: Number(o.total),
      status: o.status,
      note: o.note,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      conversation: {
        customerName: o.customerName,
        customerPic: o.customerPic,
        customerPhone: o.customerPhone,
        account: { platform: o.platform, pageName: o.pageName },
      },
    }));

    return NextResponse.json({
      orders: shaped,
      total: Number(totalRow.count),
      page,
      limit,
      statusCounts: statusCountsMap,
    });
  } catch (err) {
    console.error("Orders API error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { conversationId, orderId, items, total, status, note } = body;

  try {
    type InsertRow = { id: string };
    const [row] = await db.$queryRaw<InsertRow[]>`
      INSERT INTO orders ("id", "orderId", items, total, status, note, "conversationId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${orderId}, ${items}, ${total}::float, ${status ?? "PENDING"}::"OrderStatus", ${note ?? null}, ${conversationId}, NOW(), NOW())
      RETURNING id`;

    return NextResponse.json({ id: row.id, orderId, items, total, status: status ?? "PENDING", note, conversationId }, { status: 201 });
  } catch (err) {
    console.error("Orders POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
