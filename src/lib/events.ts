// In-memory pub/sub for real-time webhook → client notifications
// Works for single-server deployment (Cloudflare Tunnel → localhost)

type Listener = (timestamp: number) => void;

// Persist across Turbopack HMR hot reloads — without globalThis, each module
// re-evaluation creates a new empty Set and existing SSE subscribers are lost.
declare global {
  // eslint-disable-next-line no-var
  var __messageListeners: Set<Listener> | undefined;
}

const listeners: Set<Listener> =
  globalThis.__messageListeners ?? (globalThis.__messageListeners = new Set());

export function notifyNewMessage() {
  const ts = Date.now();
  listeners.forEach(fn => {
    try { fn(ts); } catch {}
  });
}

export function subscribeToMessages(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
