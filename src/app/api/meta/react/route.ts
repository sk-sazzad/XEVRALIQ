import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId, reaction } = await request.json();
  // reaction: "like" | "heart" | "haha" | "wow" | "sad" | "angry" | null (null = unreact)
  if (!messageId) return NextResponse.json({ error: "Missing messageId" }, { status: 400 });

  const message = await db.message.findUnique({
    where: { id: messageId },
    include: { conversation: { include: { account: true } } },
  });
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const { account } = message.conversation;
  const customerId = message.conversation.customerId;

  const fbRes = await fetch(`https://graph.facebook.com/v19.0/${account.pageId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: customerId },
      sender_action: reaction ? "react" : "unreact",
      payload: reaction
        ? { message_id: message.externalId, reaction }
        : { message_id: message.externalId },
      access_token: account.accessToken,
    }),
  });

  const fbData = await fbRes.json();
  if (fbData.error) {
    return NextResponse.json({ error: fbData.error.message }, { status: 400 });
  }

  await db.message.update({
    where: { id: messageId },
    data: { agentReaction: reaction ?? null },
  });

  return NextResponse.json({ success: true });
}
