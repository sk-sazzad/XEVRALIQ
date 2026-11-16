"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";

function PushSubscriber() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const subscribe = async () => {
      try {
        // Respect user's explicit opt-out from Settings
        if (localStorage.getItem("notificationsEnabled") === "false") return;

        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          // Already subscribed — ensure it's saved server-side
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(existing.toJSON()),
          });
          return;
        }

        if (Notification.permission === "denied") return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set");
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
        localStorage.setItem("notificationsEnabled", "true");
      } catch (e) {
        console.error("[push] subscribe error:", e);
      }
    };

    subscribe();
  }, [session]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PushSubscriber />
      {children}
    </SessionProvider>
  );
}
