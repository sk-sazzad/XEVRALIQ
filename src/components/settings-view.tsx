"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
  Bell,
  BellOff,
} from "lucide-react";
import type { ConnectedAccount } from "@prisma/client";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface SettingsViewProps {
  accounts: ConnectedAccount[];
  metaAppId: string;
}

function FbBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      Facebook
    </span>
  );
}

function IgBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
      Instagram
    </span>
  );
}

type NotifStatus = "loading" | "unsupported" | "denied" | "enabled" | "disabled";

function NotificationToggle() {
  const [status, setStatus] = useState<NotifStatus>("loading");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "enabled" : "disabled"))
      .catch(() => setStatus("disabled"));
  }, []);

  async function enable() {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { console.error("[push] VAPID key not set"); return; }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      localStorage.setItem("notificationsEnabled", "true");
      setStatus("enabled");
    } catch (e) { console.error("[push] enable:", e); }
    finally { setWorking(false); }
  }

  async function disable() {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      localStorage.setItem("notificationsEnabled", "false");
      setStatus("disabled");
    } catch (e) { console.error("[push] disable:", e); }
    finally { setWorking(false); }
  }

  if (status === "loading") {
    return <div className="px-5 py-4 text-sm text-gray-400">Checking…</div>;
  }
  if (status === "unsupported") {
    return (
      <div className="px-5 py-4 flex items-start gap-3">
        <BellOff className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-sm text-gray-500">Push notifications are not supported on this browser.</p>
      </div>
    );
  }
  if (status === "denied") {
    return (
      <div className="px-5 py-4 flex items-start gap-3">
        <BellOff className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-red-600 font-medium">Notifications blocked</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Go to your browser/phone settings and allow notifications for this site, then come back here.
          </p>
        </div>
      </div>
    );
  }

  const isEnabled = status === "enabled";
  return (
    <div className="px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnabled ? "bg-indigo-100" : "bg-gray-100"}`}>
          {isEnabled ? <Bell className="w-4 h-4 text-indigo-600" /> : <BellOff className="w-4 h-4 text-gray-400" />}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isEnabled ? "Notifications On" : "Notifications Off"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEnabled
              ? "You will get notified for new messages"
              : "Turn on to get notified for new messages"}
          </p>
        </div>
      </div>
      <button
        onClick={isEnabled ? disable : enable}
        disabled={working}
        aria-label={isEnabled ? "Turn off notifications" : "Turn on notifications"}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          cursor: working ? "not-allowed" : "pointer",
          opacity: working ? 0.5 : 1,
          backgroundColor: isEnabled ? "#4f46e5" : "#d1d5db",
          transition: "background-color 0.2s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute",
          left: isEnabled ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

export function SettingsView({ accounts, metaAppId }: SettingsViewProps) {
  const [connecting, setConnecting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ConnectedAccount | null>(null);

  const isMetaConfigured = !!metaAppId && metaAppId !== "your-meta-app-id";

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/meta/auth-url");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: "error", text: "Failed to generate OAuth URL" });
      }
    } catch {
      setMessage({ type: "error", text: "Connection failed" });
    } finally {
      setConnecting(false);
    }
  }

  async function handleRemove(accountId: string) {
    setRemoving(accountId);
    try {
      const res = await fetch(`/api/accounts/${accountId}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Account removed" });
        window.location.reload();
      } else {
        setMessage({ type: "error", text: "Failed to remove account" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to remove account" });
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <ConfirmDialog
        open={!!removeTarget}
        title="Disconnect Account"
        message={`Are you sure you want to disconnect "${removeTarget?.pageName}"? You will stop receiving messages from this page.`}
        confirmLabel="Disconnect"
        onConfirm={() => { if (removeTarget) handleRemove(removeTarget.id); setRemoveTarget(null); }}
        onCancel={() => setRemoveTarget(null)}
        loading={removing === removeTarget?.id}
      />
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-indigo-700" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your accounts and connections</p>
        </div>
      </div>

      {/* Alert */}
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-6 text-sm ${
            message.type === "success"
              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Meta App config warning */}
      {!isMetaConfigured && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg mb-6 bg-amber-50 border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">Meta App ID not configured</p>
            <p className="text-amber-700">
              To connect Facebook/Instagram, add{" "}
              <code className="bg-amber-100 px-1 rounded">META_APP_ID</code> and{" "}
              <code className="bg-amber-100 px-1 rounded">META_APP_SECRET</code> to your{" "}
              <code className="bg-amber-100 px-1 rounded">.env.local</code> file.
            </p>
            <a
              href="https://developers.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 text-amber-700 hover:text-amber-900 font-medium"
            >
              Open Meta for Developers
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Connected accounts section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-medium text-gray-900 text-sm">Connected Pages</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {accounts.length} {accounts.length === 1 ? "page" : "pages"} connected
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting || !isMetaConfigured}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {connecting ? "Connecting..." : "Add Page"}
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              No pages connected
            </p>
            <p className="text-xs text-gray-500">
              Click the button above to connect your Facebook/Instagram pages
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {accounts.map((account) => (
              <li key={account.id} className="px-5 py-3.5 flex items-center gap-3">
                {account.profilePic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={account.profilePic}
                    alt={account.pageName}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-500">
                      {account.pageName[0]}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {account.pageName}
                    </span>
                    {account.platform === "FACEBOOK" ? <FbBadge /> : <IgBadge />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    ID: {account.pageId}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      account.isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {account.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => setRemoveTarget(account)}
                    disabled={removing === account.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notifications section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900 text-sm">Push Notifications</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Get notified for new messages even when the app is closed
          </p>
        </div>
        <NotificationToggle />
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          How to connect Facebook pages
        </h3>
        <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside">
          <li>
            Go to{" "}
            <a
              href="https://developers.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              Meta for Developers
            </a>{" "}
            and create an app
          </li>
          <li>
            Add the App ID and Secret to <code className="bg-blue-100 px-1 rounded">.env.local</code>
          </li>
          <li>Set up the Facebook Login product</li>
          <li>
            Add this redirect URI:{" "}
            <code className="bg-blue-100 px-1 rounded">
              http://localhost:3000/api/meta/callback
            </code>
          </li>
          <li>Click the &quot;Add Page&quot; button above</li>
        </ol>
      </div>
    </div>
  );
}
