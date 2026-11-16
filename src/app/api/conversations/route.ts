import { NextRequest, NextResponse } from "next/server";
import { getConversationsWithMessages } from "@/lib/get-conversations";
import { getAuthToken } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await getConversationsWithMessages();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Conversations GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
