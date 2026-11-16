import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orders = await db.order.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { orderId, items, total, status, note } = await request.json();

  const order = await db.order.create({
    data: {
      orderId: orderId ?? `ORD-${Date.now()}`,
      items,
      total: parseFloat(total),
      status: status ?? "PENDING",
      note: note ?? null,
      conversationId: id,
    },
  });
  return NextResponse.json(order);
}
