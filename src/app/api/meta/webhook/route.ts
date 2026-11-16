import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyNewMessage } from "@/lib/events";
import { downloadMedia } from "@/lib/download-media";

// GET — Facebook webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// POST — Facebook sends real-time messages here
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify HMAC-SHA256 signature — Facebook signs with the App Secret
  const sig = request.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", process.env.META_APP_SECRET!).update(rawBody).digest("hex");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    console.error("[webhook] HMAC mismatch — check META_APP_SECRET. sig=%s expected=%s", sig.slice(0,20), expected.slice(0,20));
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = JSON.parse(rawBody);

  if (body.object !== "page" && body.object !== "instagram") {
    return NextResponse.json({ status: "ignored" });
  }

  await Promise.all((body.entry ?? []).map(async (entry) => {
    const pageId = entry.id as string;

    const account = await db.connectedAccount.findUnique({ where: { pageId } });
    if (!account) return;

    for (const event of entry.messaging ?? []) {
      // Handle delivery confirmations — update matching messages to DELIVERED
      if (event.delivery) {
        const mids: string[] = event.delivery.mids ?? [];
        const deliveryWatermark = event.delivery.watermark as number | undefined;
        if (mids.length > 0) {
          await db.message.updateMany({
            where: { externalId: { in: mids } },
            data: { deliveryStatus: "DELIVERED" },
          });
          notifyNewMessage();
        } else if (deliveryWatermark) {
          // Watermark-only delivery: Facebook batches delivered MIDs into a timestamp
          const senderId = event.sender?.id as string;
          if (senderId && senderId !== pageId) {
            const convo = await db.conversation.findUnique({ where: { externalId: `${pageId}_${senderId}` } });
            if (convo) {
              await db.message.updateMany({
                where: {
                  conversationId: convo.id,
                  direction: "OUTGOING",
                  sentAt: { lte: new Date(deliveryWatermark) },
                  deliveryStatus: "SENT",
                },
                data: { deliveryStatus: "DELIVERED" },
              });
              notifyNewMessage();
            }
          }
        }
        continue;
      }

      // Handle read receipts — customer read our messages up to this timestamp
      if (event.read) {
        const watermark = event.read.watermark as number;
        if (watermark) {
          const senderId = event.sender?.id as string;
          if (senderId && senderId !== pageId) {
            const externalConvoId = `${pageId}_${senderId}`;
            const convo = await db.conversation.findUnique({ where: { externalId: externalConvoId } });
            if (convo) {
              await db.message.updateMany({
                where: {
                  conversationId: convo.id,
                  direction: "OUTGOING",
                  sentAt: { lte: new Date(watermark) },
                  deliveryStatus: { not: "READ" },
                },
                data: { deliveryStatus: "READ" },
              });
              notifyNewMessage();
            }
          }
        }
        continue;
      }

      // Handle reaction events
      if (event.reaction) {
        const rxn = event.reaction;
        const mid = rxn.mid as string;
        const action = rxn.action as string; // "react" | "unreact"
        const reaction = (rxn.reaction ?? rxn.emoji ?? null) as string | null;
        if (mid) {
          await db.message.updateMany({
            where: { externalId: mid },
            data: { customerReaction: action === "unreact" ? null : reaction },
          });
          notifyNewMessage();
        }
        continue;
      }

      const msg = event.message;
      if (!msg) continue;

      const isEcho = !!msg.is_echo;
      // For echo (outgoing) messages, page is sender; use recipient to identify the customer
      const senderId = (isEcho ? event.recipient?.id : event.sender?.id) as string;
      if (!senderId || senderId === pageId) continue;

      const mid = msg.mid as string;
      const text = (msg.text ?? "") as string;
      const timestamp = event.timestamp as number;

      // Extract reply_to: look up the quoted message text from DB
      let replyToText: string | null = null;
      const replyToMid = msg.reply_to?.mid as string | undefined;
      if (replyToMid) {
        const original = await db.message.findUnique({ where: { externalId: replyToMid } });
        replyToText = original?.text ?? "(attachment)";
      }

      // Skip Facebook system notifications
      if (text.includes("replied to your automated welcome message") ||
          text.includes("visit Messaging settings") ||
          text.includes("You can call")) continue;

      // Extract attachments (Facebook can send multiple in one event)
      const attachments = (msg.attachments as any[]) ?? [];
      const firstAtt = attachments[0];
      const attachmentUrl: string | null = firstAtt?.payload?.url ?? null;
      const rawType: string = firstAtt?.type ?? "";
      const attachmentType: string | null = rawType
        ? (["image","audio","video"].includes(rawType) ? rawType : "file")
        : null;

      // Skip if no content at all (no text, no attachment URL, no attachment type)
      if (!text && !attachmentUrl && !attachmentType) continue;

      // Get or create conversation for this sender
      const externalConvoId = `${pageId}_${senderId}`;
      let conversation = await db.conversation.findUnique({
        where: { externalId: externalConvoId },
      });

      // Helper to fetch customer name/pic from conversation participants (reliable)
      const fetchCustomerProfile = async (): Promise<{ name: string | null; pic: string | null }> => {
        try {
          const res = await fetch(
            `https://graph.facebook.com/v19.0/${account.pageId}/conversations` +
            `?user_id=${senderId}&fields=participants{id,name,profile_pic}` +
            `&access_token=${account.accessToken}`
          );
          const data = await res.json();
          const participants: { id: string; name?: string; profile_pic?: string }[] =
            data.data?.[0]?.participants?.data ?? [];
          const customer = participants.find((p) => p.id !== account.pageId);
          return { name: customer?.name ?? null, pic: customer?.profile_pic ?? null };
        } catch {
          return { name: null, pic: null };
        }
      };

      if (!conversation) {
        const { name: customerName, pic: customerPic } = await fetchCustomerProfile();

        try {
          conversation = await db.conversation.create({
            data: {
              externalId: externalConvoId,
              customerId: senderId,
              customerName,
              customerPic,
              accountId: account.id,
              lastMessageAt: new Date(timestamp),
              hasUnread: !isEcho,
            },
          });
        } catch (createErr: any) {
          if (createErr?.code === "P2002") {
            // Race condition: another concurrent request created it first
            conversation = await db.conversation.findUnique({ where: { externalId: externalConvoId } });
            if (!conversation) continue;
          } else throw createErr;
        }
      } else {
        // If existing conversation still has no name, try to fill it in
        const updateData: { lastMessageAt: Date; hasUnread?: boolean; status?: string; customerName?: string; customerPic?: string } = {
          lastMessageAt: new Date(timestamp),
        };
        if (!isEcho) {
          updateData.hasUnread = true;
          // Customer replied — reopen conversation if it was Pending or Resolved
          if (conversation.status !== "OPEN") updateData.status = "OPEN";
        }
        if (!conversation.customerName) {
          const { name, pic } = await fetchCustomerProfile();
          if (name) updateData.customerName = name;
          if (pic) updateData.customerPic = pic;
        }
        await db.conversation.update({
          where: { id: conversation.id },
          data: updateData,
        });
      }

      // Download attachment locally before saving (so it never expires)
      let savedAttachmentUrl = attachmentUrl;
      if (attachmentUrl) {
        const localUrl = await downloadMedia(attachmentUrl, attachmentType, mid);
        if (localUrl) savedAttachmentUrl = localUrl;
      }

      // Save message (upsert to avoid duplicates)
      await db.message.upsert({
        where: { externalId: mid },
        update: {},
        create: {
          externalId: mid,
          text: text || null,
          attachmentUrl: savedAttachmentUrl,
          attachmentType,
          direction: isEcho ? "OUTGOING" : "INCOMING",
          sentAt: new Date(timestamp),
          conversationId: conversation.id,
          replyToText,
        },
      });

      // Save additional attachments from the same event (index 1+)
      for (let i = 1; i < attachments.length; i++) {
        const att = attachments[i];
        const url: string | null = att?.payload?.url ?? null;
        if (!url) continue;
        const rawT: string = att?.type ?? "";
        const attType: string | null = rawT ? (["image","audio","video"].includes(rawT) ? rawT : "file") : null;
        const extId = `${mid}_att_${i}`;
        const savedUrl = await downloadMedia(url, attType, extId) || url;
        await db.message.upsert({
          where: { externalId: extId },
          update: {},
          create: {
            externalId: extId,
            text: null,
            attachmentUrl: savedUrl,
            attachmentType: attType,
            direction: isEcho ? "OUTGOING" : "INCOMING",
            sentAt: new Date(timestamp + i),
            conversationId: conversation.id,
            replyToText: null,
          },
        });
      }

      // Notify all connected SSE clients instantly
      notifyNewMessage();

      // Fire-and-forget: push must not delay the webhook response
      if (!isEcho)
        import("@/lib/push")
          .then(({ sendPushToAll }) => sendPushToAll({
            title: conversation.customerName || "New message",
            body: text || (attachmentType ? `Sent a ${attachmentType}` : "New message"),
            conversationId: conversation.id,
            url: "/inbox",
          }))
          .catch(() => {});
    }
  }));

  return NextResponse.json({ status: "ok" });
}
