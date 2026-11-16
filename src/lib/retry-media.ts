import { db } from "@/lib/db";
import { downloadMedia } from "@/lib/download-media";

async function getFreshAttachmentUrl(externalId: string, accessToken: string): Promise<string | null> {
  try {
    const url =
      `https://graph.facebook.com/v19.0/${encodeURIComponent(externalId)}` +
      `?fields=attachments%7Btype%2Cpayload%7Burl%7D%7D` +
      `&access_token=${accessToken}`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10_000);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(tid);
    }
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) {
      console.error(`[media-retry] Graph API error for ${externalId}:`, data.error.message);
      return null;
    }
    return data.attachments?.data?.[0]?.payload?.url ?? null;
  } catch {
    return null;
  }
}

export async function retryPendingMediaDownloads() {
  try {
    // Find all messages that still have an external (Facebook CDN) URL
    const pending = await db.message.findMany({
      where: {
        attachmentUrl: { startsWith: "http" },
        attachmentType: { not: null },
      },
      take: 50,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        externalId: true,
        attachmentUrl: true,
        attachmentType: true,
        conversation: {
          select: {
            account: { select: { accessToken: true } },
          },
        },
      },
    });

    if (pending.length === 0) return;

    console.log(`[media-retry] ${pending.length} attachment(s) pending download`);

    for (const msg of pending) {
      if (!msg.attachmentUrl) continue;

      // Try downloading the existing URL first (may still be valid)
      let local = await downloadMedia(msg.attachmentUrl, msg.attachmentType, msg.externalId);

      // If that failed, use Graph API to get a fresh CDN URL
      if (!local) {
        const accessToken = msg.conversation?.account?.accessToken;
        if (accessToken) {
          const freshUrl = await getFreshAttachmentUrl(msg.externalId, accessToken);
          if (freshUrl && freshUrl !== msg.attachmentUrl) {
            local = await downloadMedia(freshUrl, msg.attachmentType, msg.externalId);
          }
          if (!local) {
            console.error(`[media-retry] failed for mid=${msg.externalId}`);
          }
        }
      }

      if (local) {
        await db.message.update({ where: { id: msg.id }, data: { attachmentUrl: local } });
        console.log(`[media-retry] saved: ${local}`);
      }
    }
  } catch (err) {
    console.error("[media-retry] error:", err);
  }
}
