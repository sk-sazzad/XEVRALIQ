import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { noteId } = await params;
  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: "Text required" }, { status: 400 });
  const updated = await db.conversationNote.update({
    where: { id: noteId },
    data: { text: text.trim() },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { noteId } = await params;
  await db.conversationNote.delete({ where: { id: noteId } });
  return NextResponse.json({ success: true });
}
