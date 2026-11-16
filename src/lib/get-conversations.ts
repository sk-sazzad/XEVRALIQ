import { db } from "@/lib/db";

type ConvoRow = {
  id: string; externalId: string; customerName: string | null;
  customerPic: string | null; customerId: string; customerPhone: string | null;
  customerAddress: string | null; tags: string[]; label: string | null;
  snoozedUntil: Date | null; status: string; hasUnread: boolean; isStarred: boolean;
  lastMessageAt: Date | null; createdAt: Date; updatedAt: Date; accountId: string;
  account: Record<string, unknown>;
  messages: Array<Record<string, unknown>>;
};

export async function getConversationsWithMessages() {
  const rows = await db.$queryRaw<ConvoRow[]>`
    SELECT
      c.id, c."externalId", c."customerName", c."customerPic", c."customerId",
      c."customerPhone", c."customerAddress", c.tags, c.label, c."snoozedUntil", c.status, c."hasUnread", c."isStarred",
      c."lastMessageAt", c."createdAt", c."updatedAt", c."accountId",

      json_build_object(
        'id',          a.id,
        'platform',    a.platform,
        'pageId',      a."pageId",
        'pageName',    a."pageName",
        'profilePic',  a."profilePic",
        'isActive',    a."isActive",
        'createdAt',   a."createdAt",
        'updatedAt',   a."updatedAt"
      ) AS account,

      COALESCE(
        (
          SELECT json_agg(msg ORDER BY msg_sent ASC)
          FROM (
            SELECT
              json_build_object(
                'id',             m.id,
                'externalId',     m."externalId",
                'text',           m.text,
                'attachmentUrl',  m."attachmentUrl",
                'attachmentType', m."attachmentType",
                'direction',        m.direction,
                'deliveryStatus',   m."deliveryStatus",
                'replyToText',      m."replyToText",
                'customerReaction', m."customerReaction",
                'agentReaction',    m."agentReaction",
                'sentAt',           m."sentAt",
                'createdAt',        m."createdAt",
                'conversationId',   m."conversationId"
              ) AS msg,
              m."sentAt" AS msg_sent
            FROM messages m
            WHERE m."conversationId" = c.id
            ORDER BY m."sentAt" DESC
            LIMIT 1
          ) recent
        ),
        '[]'::json
      ) AS messages

    FROM conversations c
    JOIN connected_accounts a ON a.id = c."accountId"
    WHERE c."snoozedUntil" IS NULL OR c."snoozedUntil" <= NOW()
    ORDER BY
      CASE
        WHEN c."snoozedUntil" IS NOT NULL AND c."snoozedUntil" <= NOW()
        THEN c."snoozedUntil"
        ELSE c."lastMessageAt"
      END DESC NULLS LAST
    LIMIT 100
  `;

  return rows.map((r) => ({ ...r, orders: [] }));
}
