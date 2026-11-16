const g = globalThis as typeof globalThis & { _instrumentationRegistered?: boolean };

export async function register() {
  // Only run on Node.js runtime (not Edge), and only in production or dev server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (g._instrumentationRegistered) return;
    g._instrumentationRegistered = true;

    const { retryPendingMediaDownloads } = await import("@/lib/retry-media");
    const { syncAllMessages } = await import("@/lib/sync-messages");

    // On startup: sync missed messages from Facebook, then download any pending media
    syncAllMessages()
      .then((n) => { if (n > 0) console.log(`[sync] startup synced ${n} messages`); })
      .catch(() => {});

    retryPendingMediaDownloads();

    // Every 5 minutes: retry any media that failed to download (e.g. during network outage)
    setInterval(retryPendingMediaDownloads, 5 * 60 * 1000);
  }
}
