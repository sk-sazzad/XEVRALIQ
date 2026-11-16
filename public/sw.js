// Service Worker — required for PWA installability
const CACHE = "xevraliq-v3";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// Network-first: always fetch fresh, fall back to cache
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Push notification handler
self.addEventListener("push", (e) => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title: "New message", body: e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(data.title || "New message", {
      body: data.body || "",
      icon: "/brand/icon-192.png",
      badge: "/brand/icon-192.png",
      tag: data.conversationId || "new-message",
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || "/inbox" },
    })
  );
});

// Click: open the app and navigate to the specific conversation
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || "/inbox";
  const fullUrl = new URL(targetUrl, self.location.origin).href;
  const convoId = new URL(fullUrl).searchParams.get("c");

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          // App is already open — focus and send a message (no page reload, works on Android + iOS)
          client.focus();
          client.postMessage({ type: "open-conversation", id: convoId });
          return;
        }
      }
      // App is closed — open it at the conversation URL (Android + iOS PWA)
      return clients.openWindow(fullUrl);
    })
  );
});
