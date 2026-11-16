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
  const notes = await db.conversationNote.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: "Text required" }, { status: 400 });
  const note = await db.conversationNote.create({
    data: { text: text.trim(), conversationId: id },
  });
  return NextResponse.json(note);
}
