"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  Search, MessageCircle, RefreshCw, Send, Paperclip,
  Smile, Check, CheckCheck, User, Filter, Star, Clock, EyeOff,
  Phone, MapPin, Calendar, ChevronRight, Image, Mic,
  Plus, MoreHorizontal, ShoppingBag, ChevronDown, X, ChevronLeft,
} from "lucide-react";
import type { Conversation, ConnectedAccount, Message } from "@prisma/client";

const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

type ConversationWithDetails = Conversation & {
  account: ConnectedAccount;
  messages: Message[];
  label?: string | null;
  snoozedUntil?: Date | null;
};

interface InboxViewProps {
  conversations: ConversationWithDetails[];
  accounts: ConnectedAccount[];
  currentUser: { name?: string | null; email?: string | null };
}

const pxMap: Record<number, number> = {
  3: 12, 4: 16, 5: 20, 7: 28, 9: 36, 10: 40, 16: 64,
};

function FbPlatformIcon({ size = 5 }: { size?: number }) {
  const px = pxMap[size] ?? 20;
  return (
    <div style={{ width: px, height: px, minWidth: px, minHeight: px, backgroundColor: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 24 24" style={{ width: 10, height: 10 }} fill="white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </div>
  );
}

function IgPlatformIcon({ size = 5 }: { size?: number }) {
  const px = pxMap[size] ?? 20;
  return (
    <div style={{ width: px, height: px, minWidth: px, minHeight: px, background: "linear-gradient(135deg,#a855f7,#ec4899)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 24 24" style={{ width: 10, height: 10 }} fill="white">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    </div>
  );
}

function PlatformIcon({ platform, size }: { platform: string; size?: number }) {
  if (platform === "FACEBOOK") return <FbPlatformIcon size={size} />;
  return <IgPlatformIcon size={size} />;
}

function timeAgo(date: Date | null): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function Avatar({ src, name, size = 10 }: { src?: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const px = pxMap[size] ?? 40;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} style={{ width: px, height: px, minWidth: px, minHeight: px, borderRadius: "50%", objectFit: "cover" }} />
    );
  }
  return (
    <div style={{ width: px, height: px, minWidth: px, minHeight: px, borderRadius: "50%", backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: px > 32 ? 14 : 11, fontWeight: 600, color: "#15803d" }}>{initials || "?"}</span>
    </div>
  );
}

function useScreenSize() {
  // Default "mobile" so SSR/initial HTML is already mobile layout (no flash on phones)
  const [size, setSize] = useState<"mobile" | "tablet" | "desktop">("mobile");
  // useLayoutEffect runs synchronously before browser paint → corrects size before user sees anything
  useLayoutEffect(() => {
    function update() {
      const w = window.innerWidth;
      setSize(w < 768 ? "mobile" : w < 1280 ? "tablet" : "desktop");
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ backgroundColor: "#fef08a", color: "#713f12", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function snippetAround(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 80) + (text.length > 80 ? "…" : "");
  const start = Math.max(0, idx - 25);
  const end = Math.min(text.length, idx + query.length + 45);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

export function InboxView({ conversations: initialConversations, accounts }: InboxViewProps) {
  const searchParams = useSearchParams();
  const filterAccountId = searchParams.get("accountId");

  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"OPEN" | "PENDING" | "RESOLVED" | "UNREAD">("OPEN");
  const [replyText, setReplyText] = useState("");
  const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<(ConversationWithDetails & { matchSnippet?: string | null })[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<{ url: string; type: "image" | "file"; name: string }[]>([]);
  const [previewLightbox, setPreviewLightbox] = useState<{ url: string; type: "image" | "file"; name: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showSnoozeDropdown, setShowSnoozeDropdown] = useState(false);
  const snoozeDropdownRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  // Responsive state
  const screenSize = useScreenSize();
  const [mobileView, setMobileView] = useState<"list" | "thread" | "customer">("list");
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";
  const isDesktop = screenSize === "desktop";
  const listVisible = isDesktop || isTablet || mobileView === "list";
  const threadVisible = isDesktop || isTablet || mobileView === "thread";
  const customerVisible = isDesktop || (isTablet && showCustomerPanel) || (isMobile && mobileView === "customer");

  const fetchingRef = useRef(false);
  async function fetchConversations(preserveTemp = false) {
    if (fetchingRef.current) return; // skip if already in-flight
    fetchingRef.current = true;
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        if (!preserveTemp) {
          setConversations(prev => {
            // If currently selected conversation is not in fresh server data (e.g. a search-
            // result that was merged in), keep it so the right panel doesn't blank out.
            const selId = selectedIdRef.current;
            if (selId && !data.find((c: any) => c.id === selId)) {
              const kept = prev.find(c => c.id === selId);
              return kept ? [kept, ...data] : data;
            }
            return data;
          });
        } else {
          setConversations(prev => {
            const merged = data.map((serverConvo: any) => {
              const prevConvo = prev.find((c: any) => c.id === serverConvo.id);
              if (!prevConvo) return serverConvo;
              // Keep temps that have no matching real outgoing message yet in server data
              const pendingTemps = prevConvo.messages.filter((m: any) => {
                if (!String(m.id).startsWith("temp_")) return false;
                const replaced = serverConvo.messages.some((sm: any) => {
                  if (sm.direction !== "OUTGOING") return false;
                  if (m.text && sm.text === m.text) return true;
                  if (m.attachmentUrl && sm.attachmentUrl === m.attachmentUrl) return true;
                  return false;
                });
                return !replaced;
              });
              return pendingTemps.length === 0 ? serverConvo : { ...serverConvo, messages: [...serverConvo.messages, ...pendingTemps] };
            });
            // Keep selected conversation if not in merged list
            const selId = selectedIdRef.current;
            if (selId && !merged.find((c: any) => c.id === selId)) {
              const kept = prev.find(c => c.id === selId);
              if (kept) return [kept, ...merged];
            }
            return merged;
          });
        }
        const selId = selectedIdRef.current;
        if (selId) fetchConversationThread(selId);
      }
    } catch {} finally { fetchingRef.current = false; }
  }

  async function doSync() {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      await fetch("/api/meta/sync", { method: "POST" });
      await fetchConversations();
    } catch {}
    finally { syncingRef.current = false; }
  }

  async function fetchConversationThread(id: string) {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: data.messages } : c));
      }
    } catch {}
  }

  // Initial client-side fetch — page ships with no data for instant HTML delivery
  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load full thread when a conversation is selected (list query returns only preview message)
  useEffect(() => {
    if (selectedId) fetchConversationThread(selectedId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // One-time init after first fetch: auto-select on desktop + populate starred
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && conversations.length > 0) {
      hasInitialized.current = true;
      if (window.innerWidth >= 768) setSelectedId(conversations[0].id);
      setStarred(new Set(conversations.filter(c => (c as any).isStarred).map(c => c.id)));
    }
  }, [conversations]);

  // Open specific conversation from push notification deep-link (?c=conversationId)
  const pushConvoId = searchParams.get("c");
  const handledPushRef = useRef<string | null>(null);
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  useEffect(() => {
    if (!pushConvoId || handledPushRef.current === pushConvoId) return;
    const convo = conversations.find((c) => c.id === pushConvoId);
    if (!convo) return;
    handledPushRef.current = pushConvoId;
    setTab("OPEN");
    setSelectedId(pushConvoId);
    if (isMobile) setMobileView("thread");
  }, [pushConvoId, conversations, isMobile]);

  // Listen for postMessage from service worker (notification click when app was already open)
  // Uses postMessage instead of client.navigate() — no page reload, works on Android + iOS
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "open-conversation" && e.data.id) {
        const convo = conversationsRef.current.find((c) => c.id === e.data.id);
        if (!convo) return;
        setTab("OPEN");
        setSelectedId(e.data.id);
        if (isMobile) setMobileView("thread");
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [isMobile]);

  // Debounced hybrid search: customer name + message content
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/conversations/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // SSE: instant update when webhook receives a message
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/events");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "new_message") fetchConversations(true);
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        // Reconnect after 3s on error
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => { es?.close(); clearTimeout(reconnectTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback polling every 3s (SSE handles real-time; this is a safety net)
  useEffect(() => {
    const interval = setInterval(() => fetchConversations(true), 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear pending attachments when switching conversations
  useEffect(() => {
    setPendingAttachments([]);
  }, [selectedId]);

  // Auto-mark as read — only re-runs when hasUnread actually flips, not on every conversations update
  const selectedConvHasUnread = (conversations.find(c => c.id === selectedId) as any)?.hasUnread ?? false;
  useEffect(() => {
    if (!selectedId || !selectedConvHasUnread) return;
    setConversations(prev => prev.map(c =>
      c.id === selectedId ? { ...c, hasUnread: false } as any : c
    ));
    fetch(`/api/conversations/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasUnread: false }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedConvHasUnread]);

  // Close tag dropdown on click-outside or conversation change
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (snoozeDropdownRef.current && !snoozeDropdownRef.current.contains(e.target as Node)) {
        setShowSnoozeDropdown(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewLightbox(null);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Notify BottomNav to hide when a conversation or customer panel is open on mobile
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("inbox:view", { detail: isMobile && mobileView !== "list" }));
  }, [isMobile, mobileView]);

  async function handleSnooze(convId: string, minutes: number) {
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setShowSnoozeDropdown(false);
    setConversations(prev => prev.filter(c => c.id !== convId));
    setSelectedId(null);
    if (isMobile) setMobileView("list");
    await fetch(`/api/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snoozedUntil }),
    });
  }

  async function handleReopen(convId: string) {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, status: "OPEN" } : c));
    setSelectedId(null);
    if (isMobile) setMobileView("list");
    await fetch(`/api/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "OPEN" }),
    });
  }

  async function handlePending(convId: string) {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, status: "PENDING" } : c));
    setSelectedId(null);
    if (isMobile) setMobileView("list");
    await fetch(`/api/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" }),
    });
  }

  async function handleResolve(convId: string) {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, status: "RESOLVED" } : c));
    setSelectedId(null);
    if (isMobile) setMobileView("list");
    await fetch(`/api/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
  }

  async function handleUpdateTags(convId: string, newTags: string[]) {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, tags: newTags } : c));
    await fetch(`/api/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: newTags }),
    });
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await doSync();
    } finally {
      setSyncing(false);
    }
  }

  async function handleSendAttachment(url: string, type: "image" | "file") {
    if (!selected) return;
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId, externalId: tempId, text: null,
      attachmentUrl: url, attachmentType: type,
      direction: "OUTGOING" as const,
      sentAt: new Date(), createdAt: new Date(),
      conversationId: selected.id,
    };
    setConversations(prev => prev.map(c =>
      c.id === selected.id
        ? { ...c, messages: [...c.messages, tempMsg as any], lastMessageAt: new Date() }
        : c
    ));
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/meta/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selected.id, attachmentUrl: url, attachmentType: type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error ?? "Failed to send");
        setConversations(prev => prev.map(c =>
          c.id === selected.id
            ? { ...c, messages: c.messages.filter(m => m.id !== tempId) }
            : c
        ));
      } else {
        fetchConversations();
      }
    } catch {
      setSendError("Network error");
      setConversations(prev => prev.map(c =>
        c.id === selected.id
          ? { ...c, messages: c.messages.filter(m => m.id !== tempId) }
          : c
      ));
    } finally { setSending(false); }
  }

  function triggerAttachment(accept: string, type: "image" | "file") {
    if (!selected || uploadingFile || sending) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      if (!files.length) return;
      setUploadingFile(true);
      setSendError(null);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
        const results = await Promise.all(
          files.map(async (file) => {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok || !data.url) return null;
            const publicUrl = data.url.startsWith("http") ? data.url : `${baseUrl}${data.url}`;
            // Detect actual type from MIME — image MIME → show thumbnail regardless of which button clicked
            const actualType: "image" | "file" = file.type.startsWith("image/") ? "image" : "file";
            return { url: publicUrl, type: actualType, name: file.name };
          })
        );
        const successful = results.filter(Boolean) as { url: string; type: "image" | "file"; name: string }[];
        const failed = files.length - successful.length;
        if (failed > 0) setSendError(`${failed}টি ফাইল upload হয়নি`);
        if (successful.length > 0) setPendingAttachments(prev => [...prev, ...successful]);
      } catch { setSendError("Upload failed"); }
      finally { setUploadingFile(false); }
    };
    input.click();
  }

  async function handleSend() {
    if (!selected || sending) return;
    const atts = pendingAttachments;
    const text = replyText.trim();
    if (!text && atts.length === 0) return;

    setPendingAttachments([]);
    if (text) setReplyText("");
    const replyRef = replyToMsg;
    setReplyToMsg(null);
    setSending(true);
    setSendError(null);

    try {
      // Send each attachment sequentially
      for (const att of atts) {
        const tempId = `temp_att_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const tempMsg = {
          id: tempId, externalId: tempId, text: null,
          attachmentUrl: att.url, attachmentType: att.type,
          direction: "OUTGOING" as const,
          sentAt: new Date(), createdAt: new Date(),
          conversationId: selected.id,
        };
        setConversations(prev => prev.map(c =>
          c.id === selected.id
            ? { ...c, messages: [...c.messages, tempMsg as any], lastMessageAt: new Date() }
            : c
        ));
        const attRes = await fetch("/api/meta/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: selected.id, attachmentUrl: att.url, attachmentType: att.type }),
        });
        const attData = await attRes.json();
        if (!attRes.ok) {
          setSendError(attData.error ?? "Failed to send attachment");
          setConversations(prev => prev.map(c =>
            c.id === selected.id
              ? { ...c, messages: c.messages.filter(m => m.id !== tempId) }
              : c
          ));
        }
      }

      // Then send text if any
      if (text) {
        const tempId = `temp_txt_${Date.now()}`;
        const tempMsg = {
          id: tempId, externalId: tempId, text,
          attachmentUrl: null, attachmentType: null,
          direction: "OUTGOING" as const,
          sentAt: new Date(), createdAt: new Date(),
          conversationId: selected.id,
          replyToText: replyRef?.text ?? null,
        };
        setConversations(prev => prev.map(c =>
          c.id === selected.id
            ? { ...c, messages: [...c.messages, tempMsg as any], lastMessageAt: new Date() }
            : c
        ));
        const txtRes = await fetch("/api/meta/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: selected.id, text,
            replyToExternalId: replyRef?.externalId ?? undefined,
            replyToText: replyRef?.text ?? undefined,
          }),
        });
        const txtData = await txtRes.json();
        if (!txtRes.ok) {
          setSendError(txtData.error ?? "Failed to send");
          setReplyText(text);
          setConversations(prev => prev.map(c =>
            c.id === selected.id
              ? { ...c, messages: c.messages.filter(m => m.id !== tempId) }
              : c
          ));
          return;
        }
      }

      fetchConversations(true);
    } catch {
      setSendError("Network error");
      if (atts.length) setPendingAttachments(atts);
      if (text) setReplyText(text);
    } finally {
      setSending(false);
    }
  }

  const filtered = conversations.filter((c) => {
    const matchSearch = !search ||
      (c.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      c.account.pageName.toLowerCase().includes(search.toLowerCase());
    const matchTab =
      tab === "UNREAD" ? (c as any).hasUnread === true :
      tab === "OPEN" ? c.status === "OPEN" :
      tab === "PENDING" ? c.status === "PENDING" :
      c.status === "RESOLVED" || c.status === "CLOSED";
    const matchAccount = !filterAccountId || c.accountId === filterAccountId;
    return matchSearch && matchTab && matchAccount;
  });

  const isSearching = searchResults !== null;
  const displayList = isSearching ? searchResults : filtered;

  const counts = {
    OPEN: conversations.filter(c => c.status === "OPEN").length,
    PENDING: conversations.filter(c => c.status === "PENDING").length,
    RESOLVED: conversations.filter(c => c.status === "RESOLVED" || c.status === "CLOSED").length,
    UNREAD: conversations.filter(c => (c as any).hasUnread === true).length,
  };

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", backgroundColor: "#f9fafb", position: "relative" }}>

      {/* ── Conversation List ── */}
      <div
        style={{
          display: listVisible ? "flex" : "none",
          flexDirection: "column",
          width: isMobile ? "100%" : "300px",
          flexShrink: 0,
          overflow: "hidden",
        }}
        className="bg-white border-r border-gray-200"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm">All Conversations</h2>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {conversations.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Filter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                title="Sync messages"
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                style={{ opacity: syncing ? 0.5 : 1 }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${searchLoading ? "pr-7" : "pr-3"}`}
            />
            {searchLoading && (
              <RefreshCw className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(["OPEN", "PENDING", "RESOLVED", "UNREAD"] as const).map((t) => {
              const isUnread = t === "UNREAD";
              const activeColor = isUnread ? "text-blue-600 border-b-2 border-blue-600" : "text-green-600 border-b-2 border-green-600";
              const countColor = isUnread
                ? (tab === t ? "text-blue-600" : "text-blue-400")
                : (tab === t ? "text-green-600" : "text-gray-400");
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 pb-2 text-xs font-medium transition-colors ${
                    tab === t ? activeColor : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                  {counts[t] > 0 && (
                    <span className={`ml-1 text-xs ${countColor}`}>
                      {counts[t]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search result count */}
        {isSearching && !searchLoading && (
          <div className="px-3 py-1.5 text-[10px] text-gray-500 bg-gray-50 border-b border-gray-100">
            {displayList.length === 0
              ? `No results for "${search}"`
              : `${displayList.length} result${displayList.length !== 1 ? "s" : ""} for "${search}"`}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {displayList.length === 0 && !searchLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <MessageCircle className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">
                {loading ? "Loading…" : isSearching ? `No results for "${search}"` : accounts.length === 0 ? "Connect a page in Settings" : "No conversations"}
              </p>
            </div>
          ) : (
            displayList.map((convo) => {
              const name = convo.customerName ?? "Unknown Customer";
              const lastMsg = convo.messages[convo.messages.length - 1];
              const isSelected = selectedId === convo.id;
              const unread = !!(convo as any).hasUnread && !isSelected;
              const snippet = (convo as any).matchSnippet as string | null | undefined;
              return (
                <button
                  key={convo.id}
                  onClick={() => {
                    // If this is a search result not in the loaded list, merge it in
                    if (isSearching && !conversations.find(c => c.id === convo.id)) {
                      setConversations(prev => [convo as ConversationWithDetails, ...prev]);
                    }
                    setSelectedId(convo.id);
                    if (isMobile) setMobileView("thread");
                    if ((convo as any).hasUnread) {
                      setConversations(prev => prev.map(c =>
                        c.id === convo.id ? { ...c, hasUnread: false } as any : c
                      ));
                      fetch(`/api/conversations/${convo.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ hasUnread: false }),
                      }).catch(() => {});
                    }
                  }}
                  className="w-full text-left px-3 py-3 border-b border-gray-100 transition-colors"
                  style={isSelected
                    ? { backgroundColor: "#f0fdf4", borderLeft: "3px solid #16a34a" }
                    : unread
                      ? { backgroundColor: "#eff6ff", borderLeft: "3px solid #2563eb" }
                      : { backgroundColor: "white", borderLeft: "3px solid transparent" }
                  }
                >
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 relative">
                      <Avatar src={convo.customerPic} name={name} size={9} />
                      {unread && (
                        <span style={{
                          position: "absolute", top: -1, right: -1,
                          width: 12, height: 12, borderRadius: "50%",
                          backgroundColor: "#2563eb", border: "2px solid white",
                        }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className="text-xs truncate"
                          style={{
                            fontWeight: unread ? 800 : 400,
                            color: isSelected ? "#15803d" : unread ? "#111827" : "#6b7280",
                          }}
                        >
                          {isSearching ? highlightText(name, search) : name}
                        </span>
                        <span suppressHydrationWarning className="text-[10px] shrink-0 ml-1" style={{ color: unread ? "#2563eb" : "#9ca3af", fontWeight: unread ? 700 : 400 }}>{timeAgo(convo.lastMessageAt)}</span>
                      </div>
                      <p className="text-[11px] leading-tight" style={{ color: unread ? "#1e40af" : "#9ca3af", fontWeight: unread ? 600 : 400, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {isSearching && snippet
                          ? highlightText(snippetAround(snippet, search), search)
                          : lastMsg?.direction === "OUTGOING" ? `You: ${lastMsg.text}` : lastMsg?.text ?? "No messages"
                        }
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <PlatformIcon platform={convo.account.platform} size={3} />
                        <span className="text-[10px] text-gray-400 truncate">{convo.account.pageName}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Message Thread ── */}
      <div
        style={{
          display: threadVisible ? "flex" : "none",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
        className="bg-white border-r border-gray-200"
      >
        {selected ? (
          <>
            {/* Thread Header */}
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                {/* Back to list (mobile) */}
                {isMobile && (
                  <button
                    onClick={() => setMobileView("list")}
                    className="p-2.5 -ml-2 text-gray-500 hover:text-gray-700 shrink-0 active:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft style={{ width: 22, height: 22 }} />
                  </button>
                )}
                <div className="shrink-0">
                  <Avatar src={selected.customerPic} name={selected.customerName ?? "?"} size={10} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {selected.customerName ?? "Unknown Customer"}
                    </span>
                    <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">
                      {selected.status === "OPEN" ? "Open" : selected.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <PlatformIcon platform={selected.account.platform} size={3} />
                    <span className="text-xs text-gray-500 truncate">{selected.account.pageName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      const nowStarred = !starred.has(selected.id);
                      setStarred(s => { const n = new Set(s); nowStarred ? n.add(selected.id) : n.delete(selected.id); return n; });
                      fetch(`/api/conversations/${selected.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isStarred: nowStarred }),
                      });
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: starred.has(selected.id) ? "#facc15" : "#d1d5db" }}
                  >
                    <Star className="w-4 h-4" fill={starred.has(selected.id) ? "currentColor" : "none"} />
                  </button>
                  {/* Customer info button (mobile + tablet) */}
                  {!isDesktop && (
                    <button
                      onClick={() => {
                        if (isMobile) setMobileView("customer");
                        else setShowCustomerPanel(p => !p);
                      }}
                      className="p-2.5 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                      title="Customer Info"
                    >
                      <User className="w-4 h-4" />
                    </button>
                  )}
                  {selected.status !== "OPEN" && (
                    <button onClick={() => handleReopen(selected.id)} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-400 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                      <MessageCircle className="w-3 h-3" />
                      Reopen
                    </button>
                  )}
                  {selected.status !== "PENDING" && (
                    <button onClick={() => handlePending(selected.id)} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-yellow-400 text-yellow-600 rounded-lg text-xs font-medium hover:bg-yellow-50 transition-colors">
                      <Clock className="w-3 h-3" />
                      Pending
                    </button>
                  )}
                  {selected.status !== "RESOLVED" && (
                    <button onClick={() => handleResolve(selected.id)} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-green-500 text-green-600 rounded-lg text-xs font-medium hover:bg-green-50 transition-colors">
                      <CheckCheck className="w-3 h-3" />
                      Resolve
                    </button>
                  )}
                </div>
              </div>
              {/* Action chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Snooze / Later button */}
                <div ref={snoozeDropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowSnoozeDropdown(p => !p)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Clock className="w-3 h-3" />
                    Later
                  </button>
                  {showSnoozeDropdown && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
                      background: "white", border: "1px solid #e5e7eb", borderRadius: "0.625rem",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "6px 0", minWidth: 180,
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", padding: "4px 14px 8px" }}>Snooze for</p>
                      {[
                        { label: "1 minute",   minutes: 1 },
                        { label: "10 minutes", minutes: 10 },
                        { label: "30 minutes", minutes: 30 },
                        { label: "1 hour",     minutes: 60 },
                        { label: "3 hours",    minutes: 180 },
                        { label: "Tomorrow",   minutes: 1440 },
                      ].map(opt => (
                        <button
                          key={opt.minutes}
                          onClick={() => handleSnooze(selected.id, opt.minutes)}
                          style={{ width: "100%", textAlign: "left", padding: "8px 14px", fontSize: 13, color: "#374151", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}
                        >
                          <Clock style={{ width: 13, height: 13, color: "#9ca3af", flexShrink: 0 }} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Mark as Unread */}
                <button
                  onClick={() => {
                    setConversations(prev => prev.map(c =>
                      c.id === selected.id ? { ...c, hasUnread: true } as any : c
                    ));
                    fetch(`/api/conversations/${selected.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ hasUnread: true }),
                    }).catch(() => {});
                    setSelectedId(null);
                    if (isMobile) setMobileView("list");
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <EyeOff className="w-3 h-3" />
                  Unread
                </button>
                {selected.status !== "OPEN" && (
                  <button onClick={() => handleReopen(selected.id)} className="sm:hidden flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-400 text-gray-600 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                    <MessageCircle className="w-3 h-3" />
                    Reopen
                  </button>
                )}
                {selected.status !== "PENDING" && (
                  <button onClick={() => handlePending(selected.id)} className="sm:hidden flex items-center gap-1 px-2.5 py-1 text-xs border border-yellow-400 text-yellow-600 bg-white rounded-lg hover:bg-yellow-50 transition-colors">
                    <Clock className="w-3 h-3" />
                    Pending
                  </button>
                )}
                {selected.status !== "RESOLVED" && (
                  <button onClick={() => handleResolve(selected.id)} className="sm:hidden flex items-center gap-1 px-2.5 py-1 text-xs border border-green-500 text-green-600 bg-white rounded-lg hover:bg-green-50 transition-colors">
                    <CheckCheck className="w-3 h-3" />
                    Resolve
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <MessageArea convo={selected} onReply={setReplyToMsg} />

            {/* Reply Input */}
            <div className="bg-white border-t border-gray-100 px-3 py-2.5" style={{ position: "relative" }}>
              {replyToMsg && (
                <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex-1 min-w-0 border-l-2 border-green-400 pl-2">
                    <p className="text-[10px] font-medium text-green-600 mb-0.5">Replying to</p>
                    <p className="text-[11px] text-gray-500 truncate">{replyToMsg.text ?? "(attachment)"}</p>
                  </div>
                  <button onClick={() => setReplyToMsg(null)} className="text-gray-400 hover:text-gray-600 shrink-0 text-lg leading-none">×</button>
                </div>
              )}
              {sendError && <p className="text-xs text-red-500 mb-2">{sendError}</p>}

              {/* Pending attachments preview */}
              {pendingAttachments.length > 0 && (
                <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-gray-500">{pendingAttachments.length}টি ফাইল নির্বাচিত</span>
                    <button
                      onClick={() => setPendingAttachments([])}
                      className="text-[10px] text-red-400 hover:text-red-600 hover:underline"
                    >সব মুছুন</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pendingAttachments.map((att, i) => (
                      <div key={i} className="relative group" style={{ flexShrink: 0 }}>
                        <button
                          onClick={() => setPreviewLightbox(att)}
                          className="block focus:outline-none"
                          style={{ padding: 0, background: "none", border: "none", cursor: "pointer" }}
                          title="Click to preview"
                        >
                          {att.type === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={att.url}
                              alt={att.name}
                              style={{ width: 56, height: 56, borderRadius: "0.5rem", objectFit: "cover", display: "block" }}
                            />
                          ) : (
                            <div style={{ width: 56, height: 56, borderRadius: "0.5rem", backgroundColor: "#e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 4 }}>
                              <Paperclip style={{ width: 16, height: 16, color: "#6b7280", flexShrink: 0 }} />
                              <span style={{ fontSize: 9, color: "#6b7280", textAlign: "center", wordBreak: "break-all", lineHeight: 1.2, maxHeight: 24, overflow: "hidden" }}>
                                {att.name.length > 12 ? att.name.slice(0, 10) + "…" : att.name}
                              </span>
                            </div>
                          )}
                        </button>
                        <button
                          onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ fontSize: 10, lineHeight: 1 }}
                          title="Remove"
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2 mb-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-green-400 focus-within:ring-1 focus-within:ring-green-400">
                  <textarea
                    rows={isMobile ? 1 : 2}
                    placeholder="Type a message..."
                    value={replyText}
                    onChange={(e) => { setReplyText(e.target.value); setSendError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    disabled={sending || uploadingFile}
                    className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none disabled:opacity-50"
                    style={{ maxHeight: 120 }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5" style={{ position: "relative" }}>
                  {/* Emoji Picker */}
                  <div ref={emojiPickerRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowEmojiPicker(p => !p)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    {showEmojiPicker && (
                      <div style={{ position: "absolute", bottom: 36, left: 0, zIndex: 50 }}>
                        <EmojiPicker
                          onEmojiSelect={(emoji: { native: string }) => {
                            setReplyText(prev => prev + emoji.native);
                            setShowEmojiPicker(false);
                          }}
                          theme="light"
                          previewPosition="none"
                          skinTonePosition="none"
                        />
                      </div>
                    )}
                  </div>
                  {/* File Attach */}
                  <button
                    onClick={() => triggerAttachment("*/*", "file")}
                    disabled={uploadingFile || sending}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Attach file"
                  >
                    {uploadingFile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </button>
                  {/* Image */}
                  <button
                    onClick={() => triggerAttachment("image/*", "image")}
                    disabled={uploadingFile || sending}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Send image"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  {/* Mic — placeholder, not implemented */}
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title="Voice (coming soon)">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={(!replyText.trim() && pendingAttachments.length === 0) || sending || uploadingFile}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: (replyText.trim() || pendingAttachments.length > 0) && !sending && !uploadingFile ? "#16a34a" : "#86efac" }}
                >
                  {sending
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                    : <><Send className="w-4 h-4" /> Send</>
                  }
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">Select a Conversation</h3>
            <p className="text-sm text-gray-400">Choose from the list to start</p>
          </div>
        )}
      </div>

      {/* ── Customer Details Panel ── */}
      {selected && customerVisible && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            flexShrink: 0,
            backgroundColor: "white",
            ...(isMobile ? {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100dvh",
              zIndex: 60,
            } : !isDesktop ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 60,
            } : {
              width: "260px",
              borderLeft: "1px solid #e5e7eb",
            }),
          }}
        >
          {/* Back/close button for non-desktop */}
          {!isDesktop && (
            <div className="flex items-center px-3 pb-1" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}>
              <button
                onClick={() => {
                  if (isMobile) setMobileView("thread");
                  else setShowCustomerPanel(false);
                }}
                className="flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
                {isMobile ? "Back to chat" : "Close"}
              </button>
            </div>
          )}
          <CustomerPanel key={selected.id} convo={selected} />
        </div>
      )}

      {/* Desktop empty placeholder when nothing selected */}
      {isDesktop && !selected && (
        <div style={{ width: "260px", flexShrink: 0 }} className="bg-white" />
      )}

      {/* Attachment Lightbox */}
      {previewLightbox && (
        <div
          onClick={() => setPreviewLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setPreviewLightbox(null)}
            style={{
              position: "absolute", top: 16, right: 20,
              background: "rgba(255,255,255,0.15)", border: "none",
              color: "white", borderRadius: "50%", width: 36, height: 36,
              fontSize: 20, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
            title="Close (Esc)"
          >×</button>

          {/* Content — stop propagation so clicking content doesn't close */}
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "85vh", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {previewLightbox.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewLightbox.url}
                alt={previewLightbox.name}
                style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: "0.75rem", objectFit: "contain", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
              />
            ) : (
              <div style={{ backgroundColor: "white", borderRadius: "1rem", padding: "32px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, minWidth: 200 }}>
                <Paperclip style={{ width: 48, height: 48, color: "#6b7280" }} />
                <span style={{ fontSize: "1rem", color: "#374151", fontWeight: 500, wordBreak: "break-all", textAlign: "center", maxWidth: 300 }}>
                  {previewLightbox.name}
                </span>
                <a
                  href={previewLightbox.url}
                  download={previewLightbox.name}
                  style={{ marginTop: 4, padding: "8px 20px", backgroundColor: "#16a34a", color: "white", borderRadius: "0.5rem", fontSize: "0.875rem", textDecoration: "none" }}
                >Download</a>
              </div>
            )}
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", maxWidth: "80vw", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {previewLightbox.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageArea({ convo, onReply }: { convo: ConversationWithDetails; onReply?: (msg: Message) => void }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const name = convo.customerName ?? "Unknown Customer";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convo.id, convo.messages.length]);

  const isSystemMsg = (text: string | null) =>
    !!text && (
      text.includes("replied to your automated welcome message") ||
      text.includes("visit Messaging settings") ||
      text.includes("You can call")
    );

  // Group messages by date, skipping system notifications
  const groups: { date: string; messages: Message[] }[] = [];
  for (const msg of convo.messages) {
    if (isSystemMsg(msg.text)) continue;
    const dateStr = formatDate(new Date(msg.sentAt));
    const last = groups[groups.length - 1];
    if (last && last.date === dateStr) last.messages.push(msg);
    else groups.push({ date: dateStr, messages: [msg] });
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="flex flex-col justify-end min-h-full px-5 py-4 space-y-1">
        {convo.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No messages yet</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-medium shrink-0">{group.date}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="space-y-3">
                {group.messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} customerName={name} customerPic={convo.customerPic} onReply={onReply} />
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const REACTIONS = [
  { key: "like",    emoji: "👍" },
  { key: "heart",   emoji: "❤️" },
  { key: "love",    emoji: "❤️" },
  { key: "haha",    emoji: "😂" },
  { key: "wow",     emoji: "😮" },
  { key: "sad",     emoji: "😢" },
  { key: "angry",   emoji: "😠" },
  { key: "dislike", emoji: "👎" },
  { key: "smile",   emoji: "😊" },
] as const;

function reactionEmoji(key: string | null | undefined): string | null {
  if (!key) return null;
  // Facebook sometimes sends the raw emoji character
  if ([...key].length === 1 || key.includes("️")) return key;
  return REACTIONS.find(r => r.key === key)?.emoji ?? key;
}

function MessageBubble({ msg, customerName, customerPic, onReply }: { msg: Message; customerName: string; customerPic?: string | null; onReply?: (msg: Message) => void }) {
  const isOutgoing = msg.direction === "OUTGOING";
  const time = new Date(msg.sentAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const attachmentUrl = msg.attachmentUrl;
  const [showReactions, setShowReactions] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>((msg as any).agentReaction ?? null);

  async function sendReaction(reactionKey: string | null) {
    const next = reactionKey === myReaction ? null : reactionKey;
    setMyReaction(next);
    setShowReactions(false);
    await fetch("/api/meta/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msg.id, reaction: next }),
    });
  }
  const attachmentType = msg.attachmentType;

  const bubbleStyle = isOutgoing
    ? { backgroundColor: "#22c55e", color: "white", borderRadius: "1rem 1rem 2px 1rem" }
    : { backgroundColor: "white", color: "#1f2937", border: "1px solid #e5e7eb", borderRadius: "1rem 1rem 1rem 2px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };

  function renderContent() {
    if (attachmentType === "image") {
      if (attachmentUrl) {
        return (
          <div style={{ ...bubbleStyle, padding: 4, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachmentUrl}
              alt="Image"
              style={{ maxWidth: 220, maxHeight: 220, borderRadius: "0.75rem", display: "block", objectFit: "cover" }}
              onError={(e) => {
                const t = e.currentTarget;
                t.style.display = "none";
                const p = t.nextElementSibling as HTMLElement | null;
                if (p) p.style.display = "flex";
              }}
            />
            <div style={{ display: "none", padding: "10px 14px", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#6b7280" }}>
              🖼 Image (expired or unavailable)
            </div>
            {msg.text && <p style={{ padding: "6px 10px 4px", fontSize: "0.8rem" }}>{msg.text}</p>}
          </div>
        );
      }
      return (
        <div style={{ ...bubbleStyle, padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem" }}>
          🖼 <span style={{ opacity: 0.7 }}>{msg.text || "Image"}</span>
        </div>
      );
    }
    if (attachmentType === "audio") {
      if (attachmentUrl) {
        return (
          <div style={{ ...bubbleStyle, padding: "10px 14px" }}>
            <audio controls src={attachmentUrl} style={{ maxWidth: 220, height: 36, display: "block" }} />
            {msg.text && <p style={{ marginTop: 4, fontSize: "0.8rem" }}>{msg.text}</p>}
          </div>
        );
      }
      return (
        <div style={{ ...bubbleStyle, padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem" }}>
          🔊 <span style={{ opacity: 0.7 }}>{msg.text || "Voice message"}</span>
        </div>
      );
    }
    if (attachmentType === "video") {
      if (attachmentUrl) {
        return (
          <div style={{ ...bubbleStyle, padding: 4, overflow: "hidden" }}>
            <video controls src={attachmentUrl} style={{ maxWidth: 220, maxHeight: 180, borderRadius: "0.75rem", display: "block" }} />
            {msg.text && <p style={{ padding: "6px 10px 4px", fontSize: "0.8rem" }}>{msg.text}</p>}
          </div>
        );
      }
      return (
        <div style={{ ...bubbleStyle, padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem" }}>
          🎥 <span style={{ opacity: 0.7 }}>{msg.text || "Video"}</span>
        </div>
      );
    }
    if (attachmentType === "file" && attachmentUrl) {
      return (
        <div style={{ ...bubbleStyle, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <Paperclip style={{ width: 14, height: 14, flexShrink: 0 }} />
          <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", textDecoration: "underline", wordBreak: "break-all" }}>
            {msg.text || "Attachment"}
          </a>
        </div>
      );
    }
    return (
      <div style={{ ...bubbleStyle, padding: "10px 14px", fontSize: "0.875rem", lineHeight: 1.6 }}>
        {msg.text || ""}
      </div>
    );
  }

  return (
    <div style={{ flexDirection: isOutgoing ? "row-reverse" : "row" }} className="group flex gap-2.5 items-end">
      <div className="shrink-0 mb-0.5">
        {isOutgoing ? (
          <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User style={{ width: 14, height: 14, color: "#15803d" }} />
          </div>
        ) : (
          <Avatar src={customerPic} name={customerName} size={7} />
        )}
      </div>
      <div className={`flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mb-1 shrink-0 ${isOutgoing ? "order-first" : "order-last"}`}>
        {/* Reaction picker */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(p => !p)}
            title="React"
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-yellow-500 transition-colors"
            style={{ fontSize: 14 }}
          >{myReaction ? REACTIONS.find(r => r.key === myReaction)?.emoji : "🙂"}</button>
          {showReactions && (
            <div
              className={`absolute bottom-7 ${isOutgoing ? "right-0" : "left-0"} flex gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-lg z-20`}
              style={{ whiteSpace: "nowrap" }}
            >
              {REACTIONS.map(r => (
                <button
                  key={r.key}
                  onClick={() => sendReaction(r.key)}
                  className={`text-[18px] hover:scale-125 transition-transform rounded-full px-0.5 ${myReaction === r.key ? "bg-blue-50 ring-1 ring-blue-300" : ""}`}
                  title={r.key}
                >{r.emoji}</button>
              ))}
            </div>
          )}
        </div>
        {onReply && (
          <button
            onClick={() => onReply(msg)}
            title="Reply"
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            style={{ fontSize: 14 }}
          >↩</button>
        )}
      </div>
      <div style={{ alignItems: isOutgoing ? "flex-end" : "flex-start", maxWidth: "72%" }} className="flex flex-col">
        {(msg as any).replyToText && (
          <div style={{
            fontSize: "0.72rem",
            color: isOutgoing ? "rgba(255,255,255,0.75)" : "#6b7280",
            backgroundColor: isOutgoing ? "rgba(0,0,0,0.12)" : "#f3f4f6",
            borderLeft: `3px solid ${isOutgoing ? "rgba(255,255,255,0.5)" : "#d1d5db"}`,
            borderRadius: "0.5rem 0.5rem 0 0",
            padding: "5px 10px",
            marginBottom: -2,
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            ↩ {((msg as any).replyToText as string).slice(0, 80)}
          </div>
        )}
        <div className="relative">
          {renderContent()}
          {/* Reaction badges below the bubble */}
          {((myReaction) || (msg as any).customerReaction) && (
            <div className={`absolute -bottom-3 flex gap-0.5 ${isOutgoing ? "left-1" : "right-1"}`}>
              {(msg as any).customerReaction && (
                <span
                  title={`${isOutgoing ? "Customer" : "Their"} reaction`}
                  className="bg-white border border-gray-200 rounded-full px-1 text-[13px] shadow-sm"
                >
                  {reactionEmoji((msg as any).customerReaction)}
                </span>
              )}
              {myReaction && (
                <button
                  onClick={() => sendReaction(myReaction)}
                  title="Remove your reaction"
                  className="bg-blue-50 border border-blue-200 rounded-full px-1 text-[13px] shadow-sm hover:scale-110 transition-transform"
                >
                  {reactionEmoji(myReaction)}
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ flexDirection: isOutgoing ? "row-reverse" : "row" }} className={`flex items-center gap-1 ${((msg as any).customerReaction || myReaction) ? "mt-4" : "mt-1"}`}>
          <span suppressHydrationWarning className="text-[10px] text-gray-400">{time}</span>
          {isOutgoing && (
            msg.deliveryStatus === "READ"
              ? <CheckCheck className="w-3 h-3" style={{ color: "#3b82f6" }} />
              : msg.deliveryStatus === "DELIVERED"
              ? <CheckCheck className="w-3 h-3" style={{ color: "#9ca3af" }} />
              : <Check className="w-3 h-3" style={{ color: "#9ca3af" }} />
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerPanel({ convo }: { convo: ConversationWithDetails }) {
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(convo.customerName ?? "");
  const [editPhone, setEditPhone] = useState((convo as any).customerPhone ?? "");
  const [editAddress, setEditAddress] = useState((convo as any).customerAddress ?? "");
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(convo.customerName ?? "Unknown Customer");
  const [displayPhone, setDisplayPhone] = useState((convo as any).customerPhone ?? "");
  const [displayAddress, setDisplayAddress] = useState((convo as any).customerAddress ?? "");
  const [tags, setTags] = useState<string[]>((convo as any).tags ?? []);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const LABELS = [
    { value: "new_customer", text: "New Customer", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    { value: "warm_lead",    text: "Warm Lead",    color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
    { value: "vip",          text: "VIP",          color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    { value: "regular",      text: "Regular",      color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    { value: "follow_up",    text: "Follow Up",    color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
    { value: "completed",    text: "Completed",    color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
  ];
  const [label, setLabel] = useState<string | null>((convo as any).label ?? null);
  const [showLabelMenu, setShowLabelMenu] = useState(false);

  type Note = { id: string; text: string; createdAt: string };
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);

  async function updateLabel(val: string | null) {
    setLabel(val);
    setShowLabelMenu(false);
    await fetch(`/api/conversations/${convo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: val }),
    });
  }

  useEffect(() => {
    setNotes([]);
    setNotesLoaded(false);
    fetch(`/api/conversations/${convo.id}/notes`)
      .then(r => r.json())
      .then(data => { setNotes(Array.isArray(data) ? data : []); setNotesLoaded(true); })
      .catch(() => setNotesLoaded(true));
  }, [convo.id]);

  async function addNote() {
    if (!newNoteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/conversations/${convo.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newNoteText.trim() }),
      });
      const created = await res.json();
      setNotes(prev => [created, ...prev]);
      setNewNoteText("");
      setShowNoteInput(false);
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote(noteId: string) {
    await fetch(`/api/conversations/${convo.id}/notes/${noteId}`, { method: "DELETE" });
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }

  async function updateNote(noteId: string, text: string) {
    const res = await fetch(`/api/conversations/${convo.id}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const updated = await res.json();
      setNotes(prev => prev.map(n => n.id === noteId ? updated : n));
    }
    setEditingNoteId(null);
  }

  type Order = { id: string; orderId: string; items: string; total: number; status: string; note?: string | null; createdAt: string };
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ orderId: "", items: "", total: "", note: "" });
  const [addingOrder, setAddingOrder] = useState(false);

  async function loadOrders() {
    if (ordersLoaded) return;
    const res = await fetch(`/api/conversations/${convo.id}/orders`);
    const data = await res.json();
    setOrders(data);
    setOrdersLoaded(true);
  }

  async function handleAddOrder() {
    if (!newOrder.items.trim() || !newOrder.total) return;
    setAddingOrder(true);
    try {
      const res = await fetch(`/api/conversations/${convo.id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: newOrder.orderId.trim() || undefined,
          items: newOrder.items.trim(),
          total: newOrder.total,
          note: newOrder.note.trim() || undefined,
        }),
      });
      const created = await res.json();
      setOrders(prev => [created, ...prev]);
      setNewOrder({ orderId: "", items: "", total: "", note: "" });
      setShowAddOrder(false);
    } finally {
      setAddingOrder(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }

  async function addTag() {
    const t = newTag.trim();
    if (!t || tags.includes(t)) { setNewTag(""); setShowTagInput(false); return; }
    const updated = [...tags, t];
    setTags(updated);
    setNewTag("");
    setShowTagInput(false);
    await fetch(`/api/conversations/${convo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: updated }),
    });
  }

  async function removeTag(tag: string) {
    const updated = tags.filter(t => t !== tag);
    setTags(updated);
    await fetch(`/api/conversations/${convo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: updated }),
    });
  }

  const name = displayName || "Unknown Customer";
  const since = new Date(convo.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  function handleStartEdit() {
    setEditName(displayName === "Unknown Customer" ? "" : displayName);
    setEditPhone(displayPhone);
    setEditAddress(displayAddress);
    setEditMode(true);
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      await fetch(`/api/conversations/${convo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editName.trim() || undefined,
          customerPhone: editPhone.trim() || undefined,
          customerAddress: editAddress.trim() || undefined,
        }),
      });
      if (editName.trim()) setDisplayName(editName.trim());
      setDisplayPhone(editPhone.trim());
      setDisplayAddress(editAddress.trim());
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ width: "260px", flexShrink: 0 }} className="bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      {/* Customer avatar + name — matches reference layout */}
      <div className="px-4 pt-5 pb-4 border-b border-gray-100">
        {/* Top row: avatar left, info right */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <Avatar src={convo.customerPic} name={name} size={16} />
            <div className="absolute -bottom-0.5 -right-0.5">
              <PlatformIcon platform={convo.account.platform} />
            </div>
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#22c55e" }} />
              <span className="text-[11px] font-medium text-green-600">New Customer</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-gray-500">
              <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
              <span className="text-[11px] truncate">{convo.account.pageName}</span>
            </div>
          </div>
        </div>
        {/* Quick action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {[
            { Icon: Phone, label: "Call", onClick: undefined },
            {
              Icon: MessageCircle, label: "Profile",
              onClick: () => {
                const url = convo.account.platform === "FACEBOOK"
                  ? `https://www.facebook.com/profile.php?id=${convo.customerId}`
                  : `https://www.instagram.com/`;
                window.open(url, "_blank", "noopener,noreferrer");
              },
            },
            { Icon: MoreHorizontal, label: "More", onClick: undefined },
          ].map(({ Icon, label, onClick }) => (
            <button key={label} onClick={onClick} className="flex flex-col items-center gap-1 text-gray-500 hover:text-green-600 transition-colors">
              <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center hover:border-green-300">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customer Details */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-gray-700">Customer Details</span>
          {!editMode ? (
            <button
              onClick={handleStartEdit}
              className="text-[10px] text-green-600 hover:underline"
            >Edit</button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(false)}
                className="text-[10px] text-gray-400 hover:underline"
              >Cancel</button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="text-[10px] text-green-600 hover:underline font-medium"
              >{saving ? "Saving…" : "Save"}</button>
            </div>
          )}
        </div>
        <div className="space-y-2.5">
          {/* Customer Name — editable */}
          <div className="flex justify-between gap-2 items-center">
            <span className="text-[11px] text-gray-400 shrink-0">Name</span>
            {editMode ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Customer name"
                className="text-[11px] text-gray-700 text-right border-b border-green-400 outline-none bg-transparent flex-1 min-w-0 placeholder-gray-300"
                autoFocus
              />
            ) : (
              <span className="text-[11px] text-gray-700 text-right truncate">{name}</span>
            )}
          </div>
          {/* Phone — editable */}
          <div className="flex justify-between gap-2 items-center">
            <span className="text-[11px] text-gray-400 shrink-0">Phone</span>
            {editMode ? (
              <input
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="+880 ..."
                type="tel"
                className="text-[11px] text-gray-700 text-right border-b border-green-400 outline-none bg-transparent flex-1 min-w-0 placeholder-gray-300"
              />
            ) : (
              <span className="text-[11px] text-right truncate" style={{ color: displayPhone ? "#374151" : "#d1d5db" }}>
                {displayPhone || "—"}
              </span>
            )}
          </div>
          {/* Address — editable */}
          <div className="flex justify-between gap-2 items-start">
            <span className="text-[11px] text-gray-400 shrink-0 pt-0.5">Address</span>
            {editMode ? (
              <textarea
                value={editAddress}
                onChange={e => setEditAddress(e.target.value)}
                placeholder="City, District..."
                rows={2}
                className="text-[11px] text-gray-700 text-right border-b border-green-400 outline-none bg-transparent flex-1 min-w-0 placeholder-gray-300 resize-none"
              />
            ) : (
              <span className="text-[11px] text-right" style={{ color: displayAddress ? "#374151" : "#d1d5db" }}>
                {displayAddress || "—"}
              </span>
            )}
          </div>
          {/* Customer ID — read-only */}
          <div className="flex justify-between gap-2">
            <span className="text-[11px] text-gray-400 shrink-0">ID</span>
            <span className="text-[11px] text-gray-500 text-right truncate font-mono">{convo.customerId}</span>
          </div>
          {/* Platform — read-only */}
          <div className="flex justify-between gap-2">
            <span className="text-[11px] text-gray-400 shrink-0">Platform</span>
            <span className="text-[11px] text-gray-700 text-right">{convo.account.platform === "FACEBOOK" ? "Facebook" : "Instagram"}</span>
          </div>
          {/* Page — read-only */}
          <div className="flex justify-between gap-2">
            <span className="text-[11px] text-gray-400 shrink-0">Page</span>
            <span className="text-[11px] text-gray-700 text-right truncate">{convo.account.pageName}</span>
          </div>
          {/* Since — read-only */}
          <div className="flex justify-between gap-2">
            <span className="text-[11px] text-gray-400 flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3" /> Since
            </span>
            <span className="text-[11px] text-gray-700">{since}</span>
          </div>
        </div>
      </div>

      {/* Conversation Stats */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-gray-700">Conversation</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-[11px] text-gray-400">Total messages</span>
            <span className="text-[11px] font-medium text-gray-700">{convo.messages.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] text-gray-400">Status</span>
            <span className={`text-[11px] font-medium ${convo.status === "OPEN" ? "text-green-600" : "text-gray-500"}`}>
              {convo.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] text-gray-400">Last message</span>
            <span suppressHydrationWarning className="text-[11px] text-gray-700">{timeAgo(convo.lastMessageAt)} ago</span>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="px-4 py-3 border-b border-gray-100" style={{ position: "relative" }}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-gray-700">Label</span>
          <button
            onClick={() => setShowLabelMenu(p => !p)}
            className="text-[10px] text-green-600 hover:underline flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" /> {label ? "Change" : "Add"}
          </button>
        </div>
        {label ? (() => {
          const ldef = LABELS.find(l => l.value === label);
          return ldef ? (
            <span
              style={{ backgroundColor: ldef.bg, color: ldef.color, border: `1px solid ${ldef.border}` }}
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: ldef.color, flexShrink: 0, display: "inline-block" }} />
              {ldef.text}
              <button onClick={() => updateLabel(null)} style={{ color: ldef.color, opacity: 0.6 }} className="hover:opacity-100 leading-none ml-0.5">×</button>
            </span>
          ) : null;
        })() : (
          <span className="text-[11px] text-gray-300">No label</span>
        )}
        {showLabelMenu && (
          <div style={{ position: "absolute", top: "100%", left: 16, right: 16, zIndex: 50, backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: "4px 0" }}>
            {LABELS.map(ldef => (
              <button
                key={ldef.value}
                onClick={() => updateLabel(ldef.value)}
                style={{ width: "100%", textAlign: "left", padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, background: label === ldef.value ? ldef.bg : "transparent" }}
                className="hover:bg-gray-50"
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: ldef.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: ldef.color, fontWeight: label === ldef.value ? 600 : 400 }}>{ldef.text}</span>
                {label === ldef.value && <span style={{ marginLeft: "auto", fontSize: 11, color: ldef.color }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-gray-700">Tags</span>
          <button
            onClick={() => setShowTagInput(true)}
            className="text-[10px] text-green-600 hover:underline flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        {/* Tag input */}
        {showTagInput && (
          <div className="flex gap-1.5 mb-2">
            <input
              autoFocus
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addTag(); if (e.key === "Escape") { setShowTagInput(false); setNewTag(""); } }}
              placeholder="Tag name..."
              className="flex-1 text-[11px] border border-green-400 rounded-md px-2 py-1 outline-none"
            />
            <button
              onClick={addTag}
              style={{ backgroundColor: "#16a34a" }}
              className="text-[10px] text-white px-2 py-1 rounded-md"
            >Add</button>
          </div>
        )}

        {/* Tag list */}
        <div className="flex flex-wrap gap-1.5">
          {tags.length === 0 && !showTagInput && (
            <span className="text-[11px] text-gray-300">No tags yet</span>
          )}
          {tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-green-400 hover:text-red-500 leading-none"
              >×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700">Notes</span>
            <span className="text-[9px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Internal</span>
            {notes.length > 0 && (
              <span className="text-[9px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{notes.length}</span>
            )}
          </div>
          <button
            onClick={() => setShowNoteInput(true)}
            className="text-[10px] text-green-600 hover:underline flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        {showNoteInput && (
          <div className="mb-3 space-y-1.5">
            <textarea
              autoFocus
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNote();
                if (e.key === "Escape") { setShowNoteInput(false); setNewNoteText(""); }
              }}
              placeholder="Write an internal note... (Ctrl+Enter to save)"
              rows={3}
              className="w-full text-[11px] border border-amber-300 rounded-md px-2 py-1.5 outline-none resize-none bg-amber-50 placeholder-amber-300 focus:ring-1 focus:ring-amber-400"
            />
            <div className="flex gap-1.5">
              <button
                onClick={addNote}
                disabled={savingNote || !newNoteText.trim()}
                style={{ backgroundColor: "#d97706" }}
                className="text-[10px] text-white px-3 py-1 rounded-md disabled:opacity-50"
              >{savingNote ? "Saving…" : "Save Note"}</button>
              <button
                onClick={() => { setShowNoteInput(false); setNewNoteText(""); }}
                className="text-[10px] text-gray-500 px-3 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
              >Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {notesLoaded && notes.length === 0 && !showNoteInput && (
            <p className="text-[11px] text-gray-300 italic">No internal notes yet</p>
          )}
          {!notesLoaded && (
            <p className="text-[11px] text-gray-300">Loading…</p>
          )}
          {notes.map(note => (
            <div key={note.id} className="group relative bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              {editingNoteId === note.id ? (
                <>
                  <textarea
                    autoFocus
                    value={editingNoteText}
                    onChange={e => setEditingNoteText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) updateNote(note.id, editingNoteText);
                      if (e.key === "Escape") setEditingNoteId(null);
                    }}
                    className="w-full text-[11px] text-gray-700 bg-white border border-amber-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
                    rows={3}
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button
                      onClick={() => updateNote(note.id, editingNoteText)}
                      disabled={!editingNoteText.trim()}
                      className="text-[10px] px-2 py-0.5 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-40 font-medium"
                    >Save</button>
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                    >Cancel</button>
                  </div>
                </>
              ) : confirmDeleteNoteId === note.id ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-red-500 font-medium">Delete this note?</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { deleteNote(note.id); setConfirmDeleteNoteId(null); }}
                      className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 font-medium"
                    >Delete</button>
                    <button
                      onClick={() => setConfirmDeleteNoteId(null)}
                      className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                    >Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap pr-4">{note.text}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span suppressHydrationWarning className="text-[10px] text-amber-500">
                      {new Date(note.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.text); }}
                        title="Edit note"
                        className="text-[14px] text-amber-400 hover:text-amber-600 leading-none transition-colors"
                      >✎</button>
                      <button
                        onClick={() => setConfirmDeleteNoteId(note.id)}
                        title="Delete note"
                        className="text-[16px] text-red-300 hover:text-red-500 leading-none font-bold transition-colors"
                      >×</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order History */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={loadOrders}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-700"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
            Order History
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          <button
            onClick={() => { loadOrders(); setShowAddOrder(true); }}
            className="text-[10px] text-green-600 hover:underline flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        {/* Add Order Form */}
        {showAddOrder && (
          <div className="mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-600">New Order</span>
              <button onClick={() => setShowAddOrder(false)}><X className="w-3 h-3 text-gray-400" /></button>
            </div>
            <input
              value={newOrder.orderId}
              onChange={e => setNewOrder(p => ({ ...p, orderId: e.target.value }))}
              placeholder="Order ID (optional)"
              className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 outline-none focus:border-green-400"
            />
            <input
              value={newOrder.items}
              onChange={e => setNewOrder(p => ({ ...p, items: e.target.value }))}
              placeholder="Items (e.g. T-Shirt x2, Pant x1)"
              className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 outline-none focus:border-green-400"
            />
            <input
              value={newOrder.total}
              onChange={e => setNewOrder(p => ({ ...p, total: e.target.value }))}
              placeholder="Total amount (৳)"
              type="number"
              className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 outline-none focus:border-green-400"
            />
            <input
              value={newOrder.note}
              onChange={e => setNewOrder(p => ({ ...p, note: e.target.value }))}
              placeholder="Note (optional)"
              className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 outline-none focus:border-green-400"
            />
            <button
              onClick={handleAddOrder}
              disabled={addingOrder || !newOrder.items.trim() || !newOrder.total}
              style={{ backgroundColor: newOrder.items.trim() && newOrder.total ? "#16a34a" : "#86efac" }}
              className="w-full text-[11px] text-white py-1.5 rounded font-medium"
            >{addingOrder ? "Saving…" : "Save Order"}</button>
          </div>
        )}

        {/* Orders List */}
        {ordersLoaded && orders.length === 0 && !showAddOrder && (
          <p className="text-[11px] text-gray-300">No orders yet</p>
        )}
        {orders.map(order => {
          const statusColors: Record<string, { bg: string; text: string }> = {
            PENDING:   { bg: "#fef9c3", text: "#854d0e" },
            CONFIRMED: { bg: "#dbeafe", text: "#1e40af" },
            SHIPPED:   { bg: "#e0f2fe", text: "#0369a1" },
            DELIVERED: { bg: "#dcfce7", text: "#15803d" },
            CANCELLED: { bg: "#fee2e2", text: "#b91c1c" },
          };
          const sc = statusColors[order.status] ?? statusColors.PENDING;
          return (
            <div key={order.id} className="mb-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[11px] font-semibold text-gray-700">#{order.orderId}</span>
                <span style={{ backgroundColor: sc.bg, color: sc.text }} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  {order.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mb-1 leading-snug">{order.items}</p>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-gray-800">৳{order.total.toLocaleString()}</span>
                <select
                  value={order.status}
                  onChange={e => updateOrderStatus(order.id, e.target.value)}
                  className="text-[10px] text-gray-500 border border-gray-200 rounded px-1 py-0.5 outline-none"
                >
                  {["PENDING","CONFIRMED","SHIPPED","DELIVERED","CANCELLED"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {order.note && <p className="text-[10px] text-gray-400 mt-1">{order.note}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
