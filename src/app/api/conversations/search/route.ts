import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthToken } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const pattern = `%${q}%`;

  try {
    const results = await db.$queryRaw<any[]>`
      SELECT
        c.id, c."externalId", c."customerName", c."customerPic", c."customerId",
        c."customerPhone", c."customerAddress", c.tags, c.label, c."snoozedUntil",
        c.status, c."hasUnread", c."isStarred", c."lastMessageAt", c."createdAt", c."updatedAt", c."accountId",

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
        ) AS messages,

        -- Best matching message text for snippet display
        (
          SELECT m2.text
          FROM messages m2
          WHERE m2."conversationId" = c.id
            AND m2.text ILIKE ${pattern}
          ORDER BY m2."sentAt" DESC
          LIMIT 1
        ) AS "matchSnippet"

      FROM conversations c
      JOIN connected_accounts a ON a.id = c."accountId"
      WHERE (
        c."customerName" ILIKE ${pattern}
        OR EXISTS (
          SELECT 1 FROM messages m3
          WHERE m3."conversationId" = c.id
            AND m3.text ILIKE ${pattern}
        )
      )
      AND (c."snoozedUntil" IS NULL OR c."snoozedUntil" <= NOW())
      ORDER BY c."lastMessageAt" DESC NULLS LAST
      LIMIT 20
    `;

    return NextResponse.json(results.map((r) => ({ ...r, orders: [] })));
  } catch (err) {
    console.error("[search] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
