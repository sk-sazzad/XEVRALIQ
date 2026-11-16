"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Trash2, Phone, X, ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

type OrderStatus = "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED" | "RETURN" | "PAID_RETURN" | "EXCHANGE" | "STOCK_OUT" | "PRE_ORDER";

interface Order {
  id: string;
  orderId: string;
  items: string;
  total: number;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
  conversation: {
    customerName: string | null;
    customerPic: string | null;
    customerPhone: string | null;
    account: { platform: string; pageName: string };
  };
}

interface ApiResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  statusCounts: Record<string, number>;
}

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

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "FACEBOOK") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "#1877f2" }}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span style={{ fontSize: 12, color: "#374151" }}>Facebook</span>
      </div>
    );
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
        <defs>
          <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433"/>
            <stop offset="25%" stopColor="#e6683c"/>
            <stop offset="50%" stopColor="#dc2743"/>
            <stop offset="75%" stopColor="#cc2366"/>
            <stop offset="100%" stopColor="#bc1888"/>
          </linearGradient>
        </defs>
        <path fill="url(#ig)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
      <span style={{ fontSize: 12, color: "#374151" }}>Instagram</span>
    </div>
  );
}

function Avatar({ name, src }: { name: string | null; src: string | null }) {
  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name ?? ""} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />;
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
      {initials}
    </div>
  );
}

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "ALL",         label: "All" },
  { key: "PENDING",     label: "Pending" },
  { key: "CONFIRMED",   label: "Confirm" },
  { key: "DELIVERED",   label: "Delivered" },
  { key: "CANCELLED",   label: "Cancel" },
  { key: "RETURN",      label: "Return" },
  { key: "PAID_RETURN", label: "Paid Return" },
  { key: "EXCHANGE",    label: "Exchange" },
  { key: "STOCK_OUT",   label: "Stock Out" },
  { key: "PRE_ORDER",   label: "Pre Order" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ─── Inline Status Dropdown ───────────────────────────────────────────────────
function StatusDropdown({ order, onChanged }: { order: Order; onChanged: (id: string, s: OrderStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = STATUS_META[order.status];

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  async function pick(status: OrderStatus) {
    if (status === order.status) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) onChanged(order.id, status);
    setSaving(false);
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px 4px 8px", borderRadius: 999,
          fontSize: 12, fontWeight: 600,
          background: s.bg, color: s.color,
          border: "none", cursor: saving ? "wait" : "pointer",
          opacity: saving ? 0.6 : 1,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
        {s.label}
        <ChevronDown style={{ width: 11, height: 11, flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
          background: "white", borderRadius: 10, border: "1px solid #e5e7eb",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 160, padding: 4,
        }}>
          {(Object.keys(STATUS_META) as OrderStatus[]).map(key => {
            const m = STATUS_META[key];
            const isCurrent = key === order.status;
            return (
              <button
                key={key}
                onClick={() => pick(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "8px 10px",
                  background: isCurrent ? "#f9fafb" : "transparent",
                  border: "none", cursor: "pointer", borderRadius: 7,
                  fontSize: 13, fontWeight: isCurrent ? 600 : 400,
                  color: "#111827", textAlign: "left",
                }}
                onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = "#f3f4f6"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isCurrent ? "#f9fafb" : "transparent"; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
                {m.label}
                {isCurrent && <span style={{ marginLeft: "auto", fontSize: 11, color: "#6b7280" }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const s = STATUS_META[order.status];
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>Order #{order.orderId}</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{formatDate(order.createdAt)}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Status</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, background: s.bg, color: s.color }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />
              {s.label}
            </span>
          </div>

          {/* Customer */}
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={order.conversation.customerName} src={order.conversation.customerPic} />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>{order.conversation.customerName ?? "Unknown"}</p>
                {order.conversation.customerPhone && (
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{order.conversation.customerPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Platform */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>Platform</span>
            <PlatformIcon platform={order.conversation.account.platform} />
          </div>

          {/* Page */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>Page</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{order.conversation.account.pageName}</span>
          </div>

          {/* Items */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Items</p>
            <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{order.items}</p>
          </div>

          {/* Total */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: order.note ? "1px solid #f3f4f6" : "none" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>৳ {order.total.toLocaleString()}</span>
          </div>

          {/* Note */}
          {order.note && (
            <div style={{ padding: "12px 0" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Note</p>
              <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{order.note}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 8 }}>
          {order.conversation.customerPhone && (
            <a
              href={`tel:${order.conversation.customerPhone}`}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", background: "#dcfce7", color: "#166534", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600 }}
            >
              <Phone style={{ width: 14, height: 14 }} />
              Call Customer
            </a>
          )}
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "10px 0", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (activeTab !== "ALL") params.set("status", activeTab);
    const res = await fetch(`/api/orders?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [activeTab, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [activeTab]);

  function handleStatusChanged(id: string, status: OrderStatus) {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        orders: prev.orders.map(o => o.id === id ? { ...o, status } : o),
        statusCounts: recalcCounts(prev.orders.map(o => o.id === id ? { ...o, status } : o)),
      };
    });
    if (viewOrder?.id === id) setViewOrder(v => v ? { ...v, status } : v);
  }

  function recalcCounts(orders: Order[]) {
    const counts: Record<string, number> = {};
    for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return counts;
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/orders/${deleteTarget.id}`, { method: "DELETE" });
    setData(prev => prev ? { ...prev, orders: prev.orders.filter(o => o.id !== deleteTarget.id), total: prev.total - 1, statusCounts: recalcCounts(prev.orders.filter(o => o.id !== deleteTarget.id)) } : prev);
    setDeleteTarget(null);
    setDeleting(false);
  }

  const totalAll = data ? Object.values(data.statusCounts).reduce((a, b) => a + b, 0) : 0;
  const totalPages = data ? Math.ceil(data.total / (data.limit ?? 10)) : 1;

  const filtered = data?.orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderId.toLowerCase().includes(q) ||
      (o.conversation.customerName ?? "").toLowerCase().includes(q) ||
      (o.conversation.customerPhone ?? "").includes(q)
    );
  }) ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f9fafb", overflow: "hidden" }}>
      {viewOrder && <ViewModal order={viewOrder} onClose={() => setViewOrder(null)} />}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Order"
        message={`Are you sure you want to delete order #${deleteTarget?.orderId}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Header */}
      <div style={{ padding: "20px 24px 0", background: "#f9fafb" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>Orders</h1>
            <span style={{ background: "#dcfce7", color: "#166534", fontSize: 13, fontWeight: 700, padding: "2px 10px", borderRadius: 999 }}>
              {totalAll}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e5e7eb", background: "white", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer" }}>
              <Filter style={{ width: 14, height: 14 }} />
              Filter
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e5e7eb" }}>
          {STATUS_TABS.map(tab => {
            const count = tab.key === "ALL" ? totalAll : (data?.statusCounts[tab.key] ?? 0);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "10px 16px", fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#16a34a" : "#6b7280",
                  borderBottom: isActive ? "2px solid #16a34a" : "2px solid transparent",
                  background: "none", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: -1,
                }}
              >
                {tab.label}
                <span style={{ background: isActive ? "#dcfce7" : "#f3f4f6", color: isActive ? "#166534" : "#6b7280", fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 999 }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ padding: "14px 0 0", display: "flex", gap: 10 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
            <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#9ca3af" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders, customer or phone..."
              style={{ width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", background: "white", color: "#111827", boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto", padding: "14px 24px 0" }}>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Order ID", "Customer", "Items", "Amount", "Status", "Platform", "Date", "Actions"].map(col => (
                  <th key={col} style={{ padding: "11px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 14 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 64, color: "#9ca3af" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 40 }}>📦</div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: 0 }}>No orders yet</p>
                      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Orders from customers will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => (
                  <tr
                    key={order.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>
                      #{order.orderId}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={order.conversation.customerName} src={order.conversation.customerPic} />
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>{order.conversation.customerName ?? "Unknown"}</p>
                          {order.conversation.customerPhone && (
                            <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{order.conversation.customerPhone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>
                      <div style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={order.items}>
                        {order.items}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>
                      ৳ {order.total.toLocaleString()}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusDropdown order={order} onChanged={handleStatusChanged} />
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <PlatformIcon platform={order.conversation.account.platform} />
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {order.conversation.customerPhone && (
                          <a
                            href={`tel:${order.conversation.customerPhone}`}
                            style={{ width: 30, height: 30, borderRadius: 8, background: "#16a34a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                            title="Call"
                          >
                            <Phone style={{ width: 13, height: 13 }} />
                          </a>
                        )}
                        <button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          style={{ width: 30, height: 30, borderRadius: 8, background: "#dbeafe", color: "#1e40af", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="View"
                        >
                          <Eye style={{ width: 13, height: 13 }} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(order)}
                          style={{ width: 30, height: 30, borderRadius: 8, background: "#fee2e2", color: "#dc2626", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Delete"
                        >
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 20px", fontSize: 13, color: "#6b7280" }}>
            <span>
              Showing {((page - 1) * data.limit) + 1}–{Math.min(page * data.limit, data.total)} of {data.total} orders
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: page === 1 ? "#f9fafb" : "white", color: page === 1 ? "#d1d5db" : "#374151", cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ChevronLeft style={{ width: 15, height: 15 }} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: page === p ? "none" : "1px solid #e5e7eb", background: page === p ? "#16a34a" : "white", color: page === p ? "white" : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: page === totalPages ? "#f9fafb" : "white", color: page === totalPages ? "#d1d5db" : "#374151", cursor: page === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
