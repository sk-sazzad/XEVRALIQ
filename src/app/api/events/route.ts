import { NextRequest } from "next/server";
import { subscribeToMessages } from "@/lib/events";
import { getAuthToken } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return new Response("Unauthorized", { status: 401 });

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        } catch {}
      };

      // Send initial ping
      send(JSON.stringify({ type: "connected", ts: Date.now() }));

      // Subscribe to new message events from webhook
      const unsubscribe = subscribeToMessages((ts) => {
        send(JSON.stringify({ type: "new_message", ts }));
      });

      // Heartbeat every 5s — forces Cloudflare Tunnel to flush its buffer
      const heartbeat = setInterval(() => {
        send(JSON.stringify({ type: "ping", ts: Date.now() }));
      }, 5000);

      // Cleanup when client disconnects
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
