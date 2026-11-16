import * as webpush from "web-push";
import { db } from "./db";

webpush.setVapidDetails(
  "mailto:admin@pairashopeai.online",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushToAll(payload: {
  title: string;
  body: string;
  conversationId?: string;
  url?: string;
}) {
  // Always deep-link to the specific conversation
  if (payload.conversationId && !payload.url?.includes("?c=")) {
    payload = { ...payload, url: `/inbox?c=${payload.conversationId}` };
  }
  const subscriptions = await db.pushSubscription.findMany();
  if (subscriptions.length === 0) return;

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { urgency: "high", TTL: 86400 },
        )
        .catch(async (err: any) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.pushSubscription.delete({ where: { id: sub.id } });
          }
        }),
    ),
  );
}
