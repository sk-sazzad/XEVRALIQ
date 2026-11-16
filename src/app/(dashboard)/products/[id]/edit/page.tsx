"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, X, Image as ImageIcon } from "lucide-react";

type ProductStatus = "ACTIVE" | "INACTIVE";

const CATEGORIES = [
  "Women Fashion", "Men Fashion", "Men Shoes", "Women Shoes",
  "Men Accessories", "Women Accessories", "Beauty & Cosmetics",
  "Islamic Essentials", "Tea & Specialties", "Gifts for Family",
  "Electronics", "Food & Beverage", "Kids & Baby", "Sports & Fitness",
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
        {label} {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  color: "#fff",
  outline: "none",
  width: "100%",
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [status, setStatus] = useState<ProductStatus>("ACTIVE");
  const [trackStock, setTrackStock] = useState(true);
  const [stock, setStock] = useState("0");
  const [lowStockAlert, setLowStockAlert] = useState("5");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [internalNote, setInternalNote] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(data => {
        setName(data.name ?? "");
        setSku(data.sku ?? "");
        setCategory(data.category ?? "");
        setPrice(String(data.price ?? ""));
        setSalePrice(data.salePrice != null ? String(data.salePrice) : "");
        setDescription(data.description ?? "");
        setImageUrls(Array.isArray(data.imageUrls) && data.imageUrls.length > 0 ? data.imageUrls : [""]);
        setStatus(data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
        setTrackStock(data.trackStock ?? true);
        setStock(String(data.stock ?? 0));
        setLowStockAlert(String(data.lowStockAlert ?? 5));
        setTags(Array.isArray(data.tags) ? data.tags : []);
        setInternalNote(data.internalNote ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!name.trim()) { setError("Product name is required"); return; }
    if (!sku.trim()) { setError("SKU is required"); return; }
    if (!category) { setError("Category is required"); return; }
    if (!price || isNaN(Number(price))) { setError("Valid price is required"); return; }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          category,
          price: Number(price),
          salePrice: salePrice ? Number(salePrice) : null,
          description: description.trim() || null,
          tags,
          status,
          imageUrls: imageUrls.filter(u => u.trim()),
          stock: Number(stock) || 0,
          trackStock,
          lowStockAlert: Number(lowStockAlert) || 5,
          internalNote: internalNote.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      router.push(`/products/${id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ background: "#080D27", flex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ height: "100%", background: "#080D27", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push(`/products/${id}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6, padding: 0, fontSize: 13 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back
          </button>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Edit Product</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push(`/products/${id}`)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#4f46e5" : "#6366f1", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, color: "#fff", cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ margin: "12px 24px 0", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, padding: "20px 24px 40px", display: "flex", gap: 20, alignItems: "flex-start", overflowY: "auto" }}>

        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Basic Info */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24 }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, color: "#fff" }}>Basic Information</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Product Name" required>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="SKU / Product ID" required>
                <input value={sku} onChange={e => setSku(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Category" required>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Regular Price (৳)" required>
                  <input value={price} onChange={e => setPrice(e.target.value)} type="number" style={inputStyle} />
                </Field>
                <Field label="Sale Price (৳)">
                  <input value={salePrice} onChange={e => setSalePrice(e.target.value)} type="number" style={inputStyle} />
                </Field>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label="Description">
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
            </div>
          </div>

          {/* Images */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: "#fff" }}>Product Images</h2>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Paste image URLs. First image is the main image.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
              {imageUrls.map((url, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div style={{ width: "100%", height: 110, borderRadius: 8, border: "1px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
                      <ImageIcon style={{ width: 24, height: 24, color: "rgba(255,255,255,0.2)" }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Image {idx + 1}</span>
                    </div>
                  )}
                  <input
                    value={url}
                    onChange={e => setImageUrls(prev => prev.map((u, i) => i === idx ? e.target.value : u))}
                    placeholder="Paste URL…"
                    style={{ marginTop: 6, ...inputStyle, fontSize: 11, padding: "5px 8px" }}
                  />
                  {imageUrls.length > 1 && (
                    <button onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 4, cursor: "pointer", color: "#fff", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X style={{ width: 10, height: 10 }} />
                    </button>
                  )}
                  {idx === 0 && url && (
                    <div style={{ position: "absolute", top: 4, left: 4, background: "#16a34a", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 600, color: "#fff" }}>Main</div>
                  )}
                </div>
              ))}
              {imageUrls.length < 10 && (
                <button onClick={() => setImageUrls(prev => [...prev, ""])} style={{ height: 110, borderRadius: 8, border: "1px dashed rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.05)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, color: "#818cf8", fontSize: 12 }}>
                  + Add
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Status */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#fff" }}>Product Status</h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: status === "ACTIVE" ? "#4ade80" : "#9ca3af" }}>
                  {status === "ACTIVE" ? "Active" : "Inactive"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  {status === "ACTIVE" ? "Visible to customers" : "Hidden"}
                </div>
              </div>
              <button onClick={() => setStatus(s => s === "ACTIVE" ? "INACTIVE" : "ACTIVE")} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: status === "ACTIVE" ? "#16a34a" : "rgba(255,255,255,0.15)", position: "relative" }}>
                <span style={{ position: "absolute", top: 3, left: status === "ACTIVE" ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </button>
            </div>
          </div>

          {/* Inventory */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#fff" }}>Inventory</h3>
            <div style={{ marginBottom: 12 }}>
              <Field label="Stock Quantity">
                <input value={stock} onChange={e => setStock(e.target.value)} type="number" style={{ ...inputStyle, padding: "7px 10px" }} />
              </Field>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Track Stock</label>
              <button onClick={() => setTrackStock(t => !t)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: trackStock ? "#16a34a" : "rgba(255,255,255,0.15)", position: "relative" }}>
                <span style={{ position: "absolute", top: 3, left: trackStock ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </button>
            </div>
            <Field label="Low Stock Alert">
              <input value={lowStockAlert} onChange={e => setLowStockAlert(e.target.value)} type="number" style={{ ...inputStyle, padding: "7px 10px" }} />
            </Field>
          </div>

          {/* Tags */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#fff" }}>Tags</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {tags.map(t => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#a5b4fc" }}>
                  {t}
                  <button onClick={() => setTags(prev => prev.filter(x => x !== t))} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: 0 }}>
                    <X style={{ width: 10, height: 10 }} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const t = tagInput.trim(); if (t && !tags.includes(t)) { setTags(p => [...p, t]); } setTagInput(""); } }}
                placeholder="Add tag…"
                style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }}
              />
              <button onClick={() => { const t = tagInput.trim(); if (t && !tags.includes(t)) setTags(p => [...p, t]); setTagInput(""); }} style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#a5b4fc", cursor: "pointer" }}>
                Add
              </button>
            </div>
          </div>

          {/* Internal Note */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#fff" }}>Internal Note</h3>
            <textarea value={internalNote} onChange={e => setInternalNote(e.target.value)} rows={4} placeholder="Notes for your team…" style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#4f46e5" : "#6366f1", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: 700, color: "#fff", cursor: saving ? "default" : "pointer", width: "100%", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
