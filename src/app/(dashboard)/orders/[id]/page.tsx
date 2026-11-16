"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Phone, MapPin, User, Package, Calendar,
  ChevronDown, Hash, FileText, Store, CheckCircle2,
} from "lucide-react";

type OrderStatus =
  | "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED"
  | "RETURN" | "PAID_RETURN" | "EXCHANGE" | "STOCK_OUT" | "PRE_ORDER";

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string; dot: string }> = {
  PENDING:    { label: "Pending",    bg: "#fef9c3", color: "#854d0e", dot: "#ca8a04" },
  CONFIRMED:  { label: "Confirm",    bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  DELIVERED:  { label: "Delivered",  bg: "#dcfce7", color: "#166534", dot: "#16a34a" },
  CANCELLED:  { label: "Cancel",     bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  RETURN:     { label: "Return",     bg: "#ffedd5", color: "#9a3412", dot: "#f97316" },
  PAID_RETURN:{ label: "Paid Return",bg: "#fce7f3", color: "#9d174d", dot: "#ec4899" },
  EXCHANGE:   { label: "Exchange",   bg: "#e0f2fe", color: "#0369a1", dot: "#0ea5e9" },
  STOCK_OUT:  { label: "Stock Out",  bg: "#f3f4f6", color: "#374151", dot: "#6b7280" },
  PRE_ORDER:  { label: "Pre Order",  bg: "#ede9fe", color: "#6d28d9", dot: "#8b5cf6" },
};

const STATUS_ORDER: OrderStatus[] = [
  "PENDING","CONFIRMED","DELIVERED","CANCELLED",
  "RETURN","PAID_RETURN","EXCHANGE","STOCK_OUT","PRE_ORDER",
];

interface Order {
  id: string;
  orderId: string;
  items: string;
  total: number;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  conversation: {
    id: string;
    customerName: string | null;
    customerPic: string | null;
    customerId: string;
    customerPhone: string | null;
    customerAddress: string | null;
    tags: string[];
    account: {
      platform: string;
      pageId: string;
      pageName: string;
      profilePic: string | null;
    };
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Avatar({ name, src, size = 48 }: { name: string | null; src: string | null; size?: number }) {
  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name ?? ""} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 700 }}>
      {initials}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const isFB = platform === "FACEBOOK";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: isFB ? "#eff6ff" : "#fdf4ff", fontSize: 12, fontWeight: 600, color: isFB ? "#1d4ed8" : "#7e22ce" }}>
      <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: isFB ? "#1877f2" : "none" }}>
        {isFB ? (
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        ) : (
          <>
            <defs>
              <linearGradient id="igb" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/>
              </linearGradient>
            </defs>
            <path fill="url(#igb)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </>
        )}
      </svg>
      {isFB ? "Facebook" : "Instagram"}
    </span>
  );
}

function StatusDropdown({ status, orderId, onChanged }: { status: OrderStatus; orderId: string; onChanged: (s: OrderStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = STATUS_META[status];

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  async function pick(newStatus: OrderStatus) {
    if (newStatus === status) { setOpen(false); return; }
    setSaving(true); setOpen(false);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) onChanged(newStatus);
    setSaving(false);
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: s.bg, color: s.color, border: "none", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot }} />
        {saving ? "Saving..." : s.label}
        <ChevronDown style={{ width: 13, height: 13 }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100, background: "white", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 170, padding: 4 }}>
          {STATUS_ORDER.map(key => {
            const m = STATUS_META[key];
            const isCurrent = key === status;
            return (
              <button
                key={key}
                onClick={() => pick(key)}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: isCurrent ? "#f9fafb" : "transparent", border: "none", cursor: "pointer", borderRadius: 8, fontSize: 13, fontWeight: isCurrent ? 600 : 400, color: "#111827", textAlign: "left" }}
                onMouseEnter={e => { if (!isCurrent)(e.currentTarget as HTMLElement).style.background = "#f3f4f6"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isCurrent ? "#f9fafb" : "transparent"; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
                {m.label}
                {isCurrent && <CheckCircle2 style={{ width: 13, height: 13, marginLeft: "auto", color: "#16a34a" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #f0f0f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 20px", borderBottom: "1px solid #f9f9f9" }}>
        <Icon style={{ width: 15, height: 15, color: "#6b7280" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderBottom: "1px solid #f9fafb" }}>
      <span style={{ fontSize: 13, color: "#9ca3af", minWidth: 110 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111827", fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setOrder(d); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f9fafb" }}>
        <div style={{ fontSize: 14, color: "#9ca3af" }}>Loading order...</div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 12, background: "#f9fafb" }}>
        <div style={{ fontSize: 48 }}>📦</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", margin: 0 }}>Order not found</p>
        <button onClick={() => router.back()} style={{ padding: "8px 20px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Go back</button>
      </div>
    );
  }

  const c = order.conversation;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", paddingBottom: 40 }}>
      {/* Top bar */}
      <div style={{ background: "white", borderBottom: "1px solid #f0f0f0", padding: "0 24px", display: "flex", alignItems: "center", gap: 16, height: 56, position: "sticky", top: 0, zIndex: 10 }}>
        <button
          onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid #e5e7eb", background: "white", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 500 }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Back
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Order #{order.orderId}</span>
          <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 10 }}>{formatDate(order.createdAt)}</span>
        </div>
        <StatusDropdown status={order.status} orderId={order.id} onChanged={s => setOrder(o => o ? { ...o, status: s } : o)} />
        {c.customerPhone && (
          <a href={`tel:${c.customerPhone}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#16a34a", color: "white", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
            <Phone style={{ width: 13, height: 13 }} />
            Call
          </a>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Order summary card */}
        <div style={{ background: "linear-gradient(135deg, #0A0F2E 0%, #1a2050 100%)", borderRadius: 16, padding: "24px", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, opacity: 0.6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Order ID</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>#{order.orderId}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, opacity: 0.6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Amount</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>৳ {order.total.toLocaleString()}</p>
            </div>
          </div>
          <div style={{ marginTop: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.5 }}>Placed on</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.5 }}>Last updated</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{formatDate(order.updatedAt)}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.5 }}>Status</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: STATUS_META[order.status].bg, color: STATUS_META[order.status].color }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_META[order.status].dot }} />
                {STATUS_META[order.status].label}
              </span>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Customer details */}
          <Section title="Customer Details" icon={User}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f3f4f6" }}>
              <Avatar name={c.customerName} src={c.customerPic} size={48} />
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>{c.customerName ?? "Unknown Customer"}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>ID: {c.customerId.slice(0, 16)}...</p>
              </div>
            </div>
            {c.customerPhone && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
                <Phone style={{ width: 14, height: 14, color: "#9ca3af", flexShrink: 0 }} />
                <a href={`tel:${c.customerPhone}`} style={{ fontSize: 13, color: "#16a34a", fontWeight: 500, textDecoration: "none" }}>{c.customerPhone}</a>
              </div>
            )}
            {c.customerAddress && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0" }}>
                <MapPin style={{ width: 14, height: 14, color: "#9ca3af", flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{c.customerAddress}</span>
              </div>
            )}
            {!c.customerPhone && !c.customerAddress && (
              <p style={{ margin: 0, fontSize: 13, color: "#d1d5db" }}>No contact info saved</p>
            )}
            {c.tags && c.tags.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {c.tags.map(tag => (
                  <span key={tag} style={{ padding: "2px 8px", background: "#f3f4f6", borderRadius: 999, fontSize: 11, color: "#6b7280" }}>{tag}</span>
                ))}
              </div>
            )}
          </Section>

          {/* Platform & Source */}
          <Section title="Platform & Source" icon={Store}>
            <Row label="Platform" value={<PlatformBadge platform={c.account.platform} />} />
            <Row label="Page name" value={c.account.pageName} />
            <Row label="Page ID" value={<span style={{ fontSize: 11, fontFamily: "monospace", color: "#6b7280" }}>{c.account.pageId}</span>} />
            <Row label="Conversation" value={
              <a href={`/inbox?conversationId=${c.id}`} style={{ color: "#4f46e5", textDecoration: "none", fontSize: 12, fontWeight: 500 }}>
                View chat →
              </a>
            } />
          </Section>
        </div>

        {/* Order Items */}
        <Section title="Order Items" icon={Package}>
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{order.items}</p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 14, borderTop: "2px solid #f3f4f6", marginTop: 8 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "0 0 2px", fontSize: 12, color: "#9ca3af" }}>Total Amount</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111827" }}>৳ {order.total.toLocaleString()}</p>
            </div>
          </div>
        </Section>

        {/* Order Info */}
        <Section title="Order Info" icon={Hash}>
          <Row label="Order ID" value={`#${order.orderId}`} />
          <Row label="Order date" value={formatDate(order.createdAt)} />
          <Row label="Last updated" value={formatDate(order.updatedAt)} />
          <Row label="Status" value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: STATUS_META[order.status].bg, color: STATUS_META[order.status].color }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_META[order.status].dot }} />
              {STATUS_META[order.status].label}
            </span>
          } />
        </Section>

        {/* Note */}
        {order.note && (
          <Section title="Note" icon={FileText}>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{order.note}</p>
          </Section>
        )}

        {/* Timeline */}
        <Section title="Timeline" icon={Calendar}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { label: "Order placed", time: order.createdAt, color: "#16a34a" },
              { label: `Status: ${STATUS_META[order.status].label}`, time: order.updatedAt, color: STATUS_META[order.status].dot },
            ].map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: 12, paddingBottom: i < 1 ? 16 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: ev.color, marginTop: 3, flexShrink: 0 }} />
                  {i < 1 && <div style={{ width: 1, flex: 1, background: "#e5e7eb", marginTop: 4 }} />}
                </div>
                <div style={{ paddingBottom: i < 1 ? 0 : 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>{ev.label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>{formatDate(ev.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
