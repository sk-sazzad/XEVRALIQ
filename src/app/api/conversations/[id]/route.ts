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
  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { sentAt: "asc" },
  });
  return NextResponse.json({ messages });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { customerName, customerPhone, customerAddress, tags, label, snoozedUntil, hasUnread, status, isStarred } = body;

  try {
    const updated = await db.conversation.update({
      where: { id },
      data: {
        customerName: customerName ?? undefined,
        customerPhone: customerPhone ?? undefined,
        customerAddress: customerAddress ?? undefined,
        tags: tags ?? undefined,
        label: label !== undefined ? (label || null) : undefined,
        snoozedUntil: snoozedUntil !== undefined ? (snoozedUntil ? new Date(snoozedUntil) : null) : undefined,
        hasUnread: hasUnread !== undefined ? hasUnread : undefined,
        status: status ?? undefined,
        isStarred: isStarred !== undefined ? isStarred : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    console.error("[PATCH /api/conversations/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
