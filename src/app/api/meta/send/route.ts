import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, text, attachmentUrl, attachmentType, replyToExternalId, replyToText } = await request.json();
  if (!conversationId || (!text?.trim() && !attachmentUrl)) {
    return NextResponse.json({ error: "Missing conversationId or message content" }, { status: 400 });
  }

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { account: true },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const { account, customerId } = conversation;

  let messagePayload: Record<string, unknown>;
  if (attachmentUrl) {
    const fbType = attachmentType === "image" ? "image" : "file";
    messagePayload = {
      attachment: {
        type: fbType,
        payload: { url: attachmentUrl, is_reusable: true },
      },
    };
  } else {
    messagePayload = { text: text.trim() };
  }
  // Note: Facebook/Instagram API does not support reply_to in outgoing messages.
  // replyToText is saved locally for agent context only.

  const fbRes = await fetch(`https://graph.facebook.com/v19.0/${account.pageId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: customerId },
      message: messagePayload,
      access_token: account.accessToken,
    }),
  });

  let fbData = await fbRes.json();

  // Facebook error #10: 24-hour messaging window expired.
  // Try message tags in order: HUMAN_AGENT → POST_PURCHASE_UPDATE
  const isWindowError = (d: typeof fbData) =>
    d.error?.code === 10 || d.error?.error_subcode === 2018065 ||
    (typeof d.error?.message === "string" && d.error.message.includes("outside of allowed window"));

  if (isWindowError(fbData)) {
    for (const tag of ["HUMAN_AGENT", "POST_PURCHASE_UPDATE"]) {
      const r = await fetch(`https://graph.facebook.com/v19.0/${account.pageId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: customerId },
          message: messagePayload,
          messaging_type: "MESSAGE_TAG",
          tag,
          access_token: account.accessToken,
        }),
      });
      fbData = await r.json();
      if (!fbData.error) break; // success
    }
  }

  if (fbData.error) {
    console.error("[send] FB error:", JSON.stringify(fbData.error));
    const isWindowErr = fbData.error.code === 10 ||
      (typeof fbData.error.message === "string" && fbData.error.message.includes("outside of allowed window"));
    const userMsg = isWindowErr
      ? "24-ঘন্টার মেসেজিং উইন্ডো পার হয়ে গেছে। Customer প্রথমে message করলে reply করা যাবে।"
      : fbData.error.message;
    return NextResponse.json({ error: userMsg }, { status: 400 });
  }

  // Save the outgoing message to DB
  await db.message.create({
    data: {
      externalId: fbData.message_id ?? `local_${Date.now()}`,
      text: text?.trim() ?? null,
      attachmentUrl: attachmentUrl ?? null,
      attachmentType: attachmentType ?? null,
      direction: "OUTGOING",
      sentAt: new Date(),
      conversationId: conversation.id,
      replyToText: replyToText ?? null,
    },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      // Reply sent — reopen if it was Pending or Resolved
      status: conversation.status !== "OPEN" ? "OPEN" : undefined,
    },
  });

  return NextResponse.json({ success: true, messageId: fbData.message_id });
}
