import { db } from "@/lib/db";
import { downloadMedia } from "@/lib/download-media";

const FETCH_TIMEOUT_MS = 15_000;

function fetchWithTimeout(url: string, opts?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function syncAllMessages(): Promise<number> {
  const accounts = await db.connectedAccount.findMany({ where: { isActive: true } });
  let totalSynced = 0;

  for (const account of accounts) {
    try {
      // Use correct platform parameter per account type
      const platform = account.platform === "INSTAGRAM" ? "instagram" : "messenger";
      const sinceTs = account.lastSyncedAt ? Math.floor(account.lastSyncedAt.getTime() / 1000) : null;

      let convoPageUrl: string | null =
        `https://graph.facebook.com/v19.0/${account.pageId}/conversations` +
        `?fields=id,participants{id,name,profile_pic},updated_time` +
        `&platform=${platform}&limit=25` +
        (sinceTs ? `&updated_since=${sinceTs}` : "") +
        `&access_token=${account.accessToken}`;

      while (convoPageUrl) {
        const convoRes = await fetchWithTimeout(convoPageUrl);
        const convoData = await convoRes.json();
        if (convoData.error) {
          console.error(`[sync] conversations fetch error for ${account.pageId}:`, convoData.error);
          break;
        }
        convoPageUrl = convoData.paging?.next ?? null;

        for (const convo of convoData.data ?? []) {
          type Participant = { id: string; name?: string; profile_pic?: string };
          const customer = (convo.participants?.data ?? []).find(
            (p: Participant) => p.id !== account.pageId
          ) as Participant | undefined;
          if (!customer) continue;

          let customerPic = customer.profile_pic ?? null;
          if (!customerPic) {
            try {
              const picRes = await fetchWithTimeout(
                `https://graph.facebook.com/v19.0/${customer.id}/picture` +
                `?type=square&redirect=false&access_token=${account.accessToken}`
              );
              const picData = await picRes.json();
              customerPic = picData?.data?.url ?? null;
            } catch {}
          }

          const externalConvoId = `${account.pageId}_${customer.id}`;

          let dbConvo = await db.conversation.findUnique({ where: { externalId: externalConvoId } });

          if (!dbConvo) {
            dbConvo = await db.conversation.create({
              data: {
                externalId: externalConvoId,
                customerId: customer.id,
                customerName: customer.name ?? null,
                customerPic,
                accountId: account.id,
                lastMessageAt: convo.updated_time ? new Date(convo.updated_time) : null,
              },
            });
          } else {
            await db.conversation.update({
              where: { id: dbConvo.id },
              data: {
                customerName: customer.name ?? dbConvo.customerName,
                customerPic: customerPic ?? dbConvo.customerPic,
                lastMessageAt: convo.updated_time ? new Date(convo.updated_time) : dbConvo.lastMessageAt,
              },
            });
          }

          // Paginate through ALL messages for this conversation
          let msgsUrl: string | null =
            `https://graph.facebook.com/v19.0/${convo.id}/messages` +
            `?fields=id,message,from,created_time,attachments{type,payload{url}}` +
            `&limit=100` +
            (sinceTs ? `&since=${sinceTs}` : "") +
            `&access_token=${account.accessToken}`;

          while (msgsUrl) {
            const msgsRes = await fetchWithTimeout(msgsUrl);
            const msgsData = await msgsRes.json();
            if (msgsData.error) {
              console.error(`[sync] messages fetch error for convo ${convo.id}:`, msgsData.error);
              break;
            }
            msgsUrl = msgsData.paging?.next ?? null;

            for (const msg of msgsData.data ?? []) {
              const text: string = msg.message ?? "";
              if (
                text.includes("replied to your automated welcome message") ||
                text.includes("visit Messaging settings") ||
                text.includes("You can call")
              ) continue;

              const attachment = msg.attachments?.data?.[0];
              let attachmentUrl: string | null = attachment?.payload?.url ?? null;
              const rawType: string = attachment?.type ?? "";
              const attachmentType: string | null = rawType
                ? (["image", "audio", "video"].includes(rawType) ? rawType : "file")
                : null;

              if (!text && !attachmentUrl && !attachmentType) continue;

              // Download media locally if not already done
              if (attachmentUrl) {
                const local = await downloadMedia(attachmentUrl, attachmentType, msg.id);
                if (local) attachmentUrl = local;
              }

              const isIncoming = msg.from?.id !== account.pageId;
              await db.message.upsert({
                where: { externalId: msg.id },
                update: {},
                create: {
                  externalId: msg.id,
                  text: text || null,
                  attachmentUrl,
                  attachmentType,
                  direction: isIncoming ? "INCOMING" : "OUTGOING",
                  sentAt: new Date(msg.created_time),
                  conversationId: dbConvo.id,
                },
              });
              totalSynced++;
            }
          }
        }
      }
      await db.connectedAccount.update({ where: { id: account.id }, data: { lastSyncedAt: new Date() } });
    } catch (err) {
      console.error(`[sync] account ${account.pageId} error:`, err);
    }
  }

  return totalSynced;
}
