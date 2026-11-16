"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Copy, Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

type ProductStatus = "ACTIVE" | "INACTIVE";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  variantCount: number;
  totalStock: number;
  stock: number;
  status: ProductStatus;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  statusCounts: Record<string, number>;
}

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "INACTIVE", label: "Inactive" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Women Fashion": "bg-pink-500/20 text-pink-300",
  "Men Shoes": "bg-blue-500/20 text-blue-300",
  "Women Accessories": "bg-purple-500/20 text-purple-300",
  "Men Accessories": "bg-cyan-500/20 text-cyan-300",
  "Beauty & Cosmetics": "bg-rose-500/20 text-rose-300",
  "Islamic Essentials": "bg-green-500/20 text-green-300",
  "Tea & Specialties": "bg-amber-500/20 text-amber-300",
  "Gifts for Family": "bg-orange-500/20 text-orange-300",
  "Electronics": "bg-indigo-500/20 text-indigo-300",
  "Food & Beverage": "bg-lime-500/20 text-lime-300",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "bg-white/10 text-white/70";
}

function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === "ACTIVE") {
    return (
      <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)", whiteSpace: "nowrap" }}>
        Active
      </span>
    );
  }
  return (
    <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "rgba(107,114,128,0.15)", color: "#9ca3af", border: "1px solid rgba(107,114,128,0.3)", whiteSpace: "nowrap" }}>
      Inactive
    </span>
  );
}

function ProductImage({ imageUrls, name }: { imageUrls: string[]; name: string }) {
  const imageUrl = imageUrls?.[0] ?? null;
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
    );
  }
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{ width: 44, height: 44, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const fetchProducts = useCallback(async (p: number, tab: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (tab) params.set("status", tab);
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data: ApiResponse = await res.json();
      setProducts(data.products);
      setTotal(data.total);
      setStatusCounts(data.statusCounts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page, activeTab);
  }, [page, activeTab, fetchProducts]);

  const filtered = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const allCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + "\n" +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/products?id=${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    setDeleting(false);
    fetchProducts(page, activeTab);
  }

  async function handleDuplicate(p: Product) {
    setDuplicating(p.id);
    try {
      const res = await fetch(`/api/products/${p.id}`);
      const full = await res.json();
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...full,
          name: `${full.name} (Copy)`,
          sku: `${full.sku}-CP`,
          variants: (full.variants ?? []).map((v: { sku: string }) => ({ ...v, sku: `${v.sku}-CP` })),
        }),
      });
      fetchProducts(page, activeTab);
    } finally {
      setDuplicating(null);
    }
  }

  return (
    <div style={{ flex: 1, background: "#080D27", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      {/* Header */}
      <div style={{ padding: "24px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Products</h1>
          <span style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 20, padding: "2px 12px", fontSize: 13, fontWeight: 600 }}>
            {allCount}
          </span>
        </div>
        <button
          onClick={() => router.push("/products/add")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Add Product
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: "16px 24px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 0 }}>
        {STATUS_TABS.map(tab => {
          const count = tab.key === "" ? allCount : (statusCounts[tab.key] ?? 0);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "8px 16px", fontSize: 14, fontWeight: 500,
                color: isActive ? "#818cf8" : "rgba(255,255,255,0.4)",
                borderBottom: isActive ? "2px solid #818cf8" : "2px solid transparent",
                marginBottom: -1, display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab.label}
              <span style={{ background: isActive ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.08)", color: isActive ? "#a5b4fc" : "rgba(255,255,255,0.4)", borderRadius: 10, padding: "0px 7px", fontSize: 12, fontWeight: 600 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ padding: "16px 24px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "rgba(255,255,255,0.3)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px 7px 32px", fontSize: 13, color: "#fff", outline: "none" }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, padding: "0 24px 24px", overflowX: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16 }}>No products yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Add your first product to get started</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Image", "Product Name", "SKU / Product ID", "Category", "Price", "Variants", "Stock", "Status", "Created At", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const dateLines = formatDate(p.createdAt).split("\n");
                const displayStock = p.variantCount > 0 ? p.totalStock : p.stock;
                const isLowStock = displayStock === 0;
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px 12px" }}>
                      <ProductImage imageUrls={p.imageUrls} name={p.name} />
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{p.category}</div>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ fontSize: 13, color: "#818cf8", fontFamily: "monospace" }}>{p.sku}</span>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${categoryColor(p.category)}`}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>৳ {p.price.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <span style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                        {p.variantCount}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: isLowStock ? "#f87171" : "#fff" }}>
                        {p.variantCount > 0 ? p.totalStock : p.stock}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{dateLines[0]}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{dateLines[1]}</div>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button title="View" onClick={() => router.push(`/products/${p.id}`)} style={{ padding: 6, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}>
                          <Eye style={{ width: 14, height: 14 }} />
                        </button>
                        <button title="Edit" onClick={() => router.push(`/products/${p.id}/edit`)} style={{ padding: 6, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}>
                          <Pencil style={{ width: 14, height: 14 }} />
                        </button>
                        <button title="Duplicate" onClick={() => handleDuplicate(p)} disabled={duplicating === p.id} style={{ padding: 6, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 6, cursor: duplicating === p.id ? "default" : "pointer", color: duplicating === p.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)", display: "flex" }}>
                          <Copy style={{ width: 14, height: 14 }} />
                        </button>
                        <button title="Delete" onClick={() => setDeleteTarget(p)} style={{ padding: 6, background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, cursor: "pointer", color: "#f87171", display: "flex" }}>
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} products
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, cursor: page === 1 ? "default" : "pointer", color: page === 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", display: "flex", alignItems: "center" }}>
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && page > 3) p = page - 2 + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ padding: "6px 12px", background: page === p ? "#6366f1" : "rgba(255,255,255,0.05)", border: "1px solid", borderColor: page === p ? "#6366f1" : "rgba(255,255,255,0.1)", borderRadius: 6, cursor: "pointer", color: page === p ? "#fff" : "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: page === p ? 600 : 400 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "6px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, cursor: page === totalPages ? "default" : "pointer", color: page === totalPages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", display: "flex", alignItems: "center" }}>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
