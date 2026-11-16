"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Pencil, Package } from "lucide-react";

type Variant = {
  id: string;
  attributes: Record<string, string>;
  sku: string;
  price: number;
  stock: number;
  status: string;
  imageUrl: string | null;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  salePrice: number | null;
  description: string | null;
  tags: string[];
  status: string;
  imageUrls: string[];
  stock: number;
  trackStock: boolean;
  lowStockAlert: number;
  internalNote: string | null;
  attributes: unknown;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", flexShrink: 0, marginRight: 16 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#e2e8f0", textAlign: "right" }}>{value ?? "—"}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#a5b4fc" }}>{title}</h3>
      {children}
    </div>
  );
}

export default function ProductViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "#080D27", flex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  if (!product || (product as unknown as { error: string }).error) {
    return (
      <div style={{ background: "#080D27", flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Package style={{ width: 48, height: 48, color: "rgba(255,255,255,0.2)" }} />
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Product not found</div>
        <button onClick={() => router.push("/products")} style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#a5b4fc", cursor: "pointer" }}>
          Back to Products
        </button>
      </div>
    );
  }

  const attrKeys = product.variants.length > 0
    ? Object.keys(product.variants[0].attributes ?? {})
    : [];

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ background: "#080D27", flex: 1, minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => router.push("/products")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6, padding: 0, fontSize: 13 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Products
          </button>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{product.name}</h1>
          <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: product.status === "ACTIVE" ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.15)", color: product.status === "ACTIVE" ? "#4ade80" : "#9ca3af", border: `1px solid ${product.status === "ACTIVE" ? "rgba(34,197,94,0.3)" : "rgba(107,114,128,0.3)"}`, whiteSpace: "nowrap" }}>
            {product.status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
        </div>
        <button
          onClick={() => router.push(`/products/${id}/edit`)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          <Pencil style={{ width: 14, height: 14 }} />
          Edit Product
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "24px", display: "flex", gap: 20, alignItems: "flex-start", overflowY: "auto", flexWrap: "wrap" }}>

        {/* Left column */}
        <div style={{ flex: 1, minWidth: 300 }}>

          {/* Images */}
          {product.imageUrls.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {product.imageUrls.map((url, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={product.name} style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    {i === 0 && <div style={{ position: "absolute", top: 4, left: 4, background: "#16a34a", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 600, color: "#fff" }}>Main</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <Card title="Basic Information">
            <Row label="Product Name" value={<strong>{product.name}</strong>} />
            <Row label="SKU" value={<span style={{ fontFamily: "monospace", color: "#818cf8" }}>{product.sku}</span>} />
            <Row label="Category" value={product.category} />
            <Row label="Regular Price" value={`৳ ${product.price.toLocaleString()}`} />
            {product.salePrice != null && <Row label="Sale Price" value={`৳ ${product.salePrice.toLocaleString()}`} />}
            {product.description && <Row label="Description" value={<span style={{ maxWidth: 400, display: "inline-block", wordBreak: "break-word", textAlign: "left" }}>{product.description}</span>} />}
          </Card>

          {/* Variants */}
          {product.variants.length > 0 && (
            <Card title={`Variants (${product.variants.length})`}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {attrKeys.map(k => (
                        <th key={k} style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{k}</th>
                      ))}
                      <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>SKU</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Price</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Stock</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map(v => (
                      <tr key={v.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {attrKeys.map(k => (
                          <td key={k} style={{ padding: "8px 10px", fontSize: 13, color: "#e2e8f0" }}>{v.attributes[k] ?? "—"}</td>
                        ))}
                        <td style={{ padding: "8px 10px", fontSize: 12, color: "#818cf8", fontFamily: "monospace" }}>{v.sku}</td>
                        <td style={{ padding: "8px 10px", fontSize: 13 }}>৳ {v.price.toLocaleString()}</td>
                        <td style={{ padding: "8px 10px", fontSize: 13, color: v.stock === 0 ? "#f87171" : "#fff", fontWeight: 600 }}>{v.stock}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: v.status === "ACTIVE" ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.15)", color: v.status === "ACTIVE" ? "#4ade80" : "#9ca3af" }}>
                            {v.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>

          {/* Inventory */}
          <Card title="Inventory">
            <Row label="Stock" value={<span style={{ color: product.stock === 0 ? "#f87171" : "#4ade80", fontWeight: 600 }}>{product.variants.length > 0 ? "Per variant" : product.stock}</span>} />
            <Row label="Track Stock" value={product.trackStock ? "Yes" : "No"} />
            <Row label="Low Stock Alert" value={`< ${product.lowStockAlert}`} />
          </Card>

          {/* Tags */}
          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <Card title="Tags">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {product.tags.map(t => (
                  <span key={t} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#a5b4fc" }}>
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Internal Note */}
          {product.internalNote && (
            <Card title="Internal Note">
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{product.internalNote}</p>
            </Card>
          )}

          {/* Timeline */}
          <Card title="Timeline">
            <Row label="Created" value={fmt(product.createdAt)} />
            <Row label="Updated" value={fmt(product.updatedAt)} />
          </Card>
        </div>
      </div>
    </div>
  );
}
