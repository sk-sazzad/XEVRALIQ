"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Trash2, GripVertical, Image as ImageIcon, Upload } from "lucide-react";

type ProductStatus = "ACTIVE" | "INACTIVE";

interface AttributeRow {
  id: string;
  name: string;
  values: string[];
  inputVal: string;
}

interface VariantRow {
  id: string;
  attributes: Record<string, string>;
  sku: string;
  price: string;
  stock: string;
  status: ProductStatus;
  imageUrl: string;
}

const CATEGORIES = [
  "Women Fashion", "Men Fashion", "Men Shoes", "Women Shoes",
  "Men Accessories", "Women Accessories", "Beauty & Cosmetics",
  "Islamic Essentials", "Tea & Specialties", "Gifts for Family",
  "Electronics", "Food & Beverage", "Kids & Baby", "Sports & Fitness",
];

function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])),
    [[]]
  );
}

function slugify(val: string) {
  return val.toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "").slice(0, 8);
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/* ───────── Section header ───────── */
function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {num}
        </div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ───────── Input ───────── */
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

/* ── Variant Image Picker ── */
function VariantImagePicker({ value, imageUrls, onChange }: {
  value: string;
  imageUrls: string[];
  onChange: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const validImages = imageUrls.filter(u => u.trim());

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        title={value || "Select image"}
        style={{
          width: 36, height: 36, borderRadius: 6,
          border: `1px solid ${value ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
          background: "rgba(255,255,255,0.04)",
          cursor: "pointer", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <ImageIcon style={{ width: 14, height: 14, color: "rgba(255,255,255,0.3)" }} />
        )}
      </div>
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ background: "#151929", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 20, maxWidth: 380, width: "90%", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc", marginBottom: 14 }}>ইমেজ সিলেক্ট করুন</div>
            {validImages.length === 0 ? (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", padding: "8px 0" }}>
                উপরে Product Images section-এ ইমেজ যোগ করুন
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {validImages.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt=""
                    onClick={() => { onChange(url); setOpen(false); }}
                    style={{
                      width: 72, height: 72, objectFit: "cover", borderRadius: 8,
                      cursor: "pointer",
                      border: value === url ? "3px solid #6366f1" : "3px solid transparent",
                      outline: value === url ? "1px solid rgba(99,102,241,0.4)" : "none",
                    }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {value && (
                <button
                  onClick={() => { onChange(""); setOpen(false); }}
                  style={{ flex: 1, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px", fontSize: 12, color: "#f87171", cursor: "pointer" }}
                >
                  Remove Image
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px", fontSize: 12, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────── Main page ───────── */
export default function AddProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Basic Info
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");

  // Images
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  // Attributes
  const [attrs, setAttrs] = useState<AttributeRow[]>([]);

  // Variants
  const [variants, setVariants] = useState<VariantRow[]>([]);

  // Sidebar
  const [status, setStatus] = useState<ProductStatus>("ACTIVE");
  const [trackStock, setTrackStock] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState("5");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [internalNote, setInternalNote] = useState("");

  // Image upload
  const [uploading, setUploading] = useState<number[]>([]);

  function triggerFileUpload(idx: number) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(prev => [...prev, idx]);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) setImageUrls(prev => prev.map((u, i) => i === idx ? data.url : u));
        else alert(data.error ?? "Upload failed");
      } catch {
        alert("Upload failed");
      } finally {
        setUploading(prev => prev.filter(i => i !== idx));
      }
    };
    input.click();
  }

  // Bulk edit state
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [bulkSkuBase, setBulkSkuBase] = useState("");

  /* ── attr helpers ── */
  const addAttr = () => {
    setAttrs(prev => [...prev, { id: uid(), name: "", values: [], inputVal: "" }]);
  };

  const updateAttrName = (id: string, val: string) => {
    setAttrs(prev => prev.map(a => a.id === id ? { ...a, name: val } : a));
  };

  const addAttrValue = (id: string) => {
    setAttrs(prev => prev.map(a => {
      if (a.id !== id) return a;
      const v = a.inputVal.trim();
      if (!v || a.values.includes(v)) return { ...a, inputVal: "" };
      return { ...a, values: [...a.values, v], inputVal: "" };
    }));
  };

  const removeAttrValue = (id: string, val: string) => {
    setAttrs(prev => prev.map(a => a.id === id ? { ...a, values: a.values.filter(v => v !== val) } : a));
  };

  const removeAttr = (id: string) => setAttrs(prev => prev.filter(a => a.id !== id));

  /* ── generate variants ── */
  const generateVariants = useCallback(() => {
    const validAttrs = attrs.filter(a => a.name.trim() && a.values.length > 0);
    if (!validAttrs.length) { setVariants([]); return; }

    const combos = cartesian(validAttrs.map(a => a.values));
    const baseSku = sku.trim() || "PROD";

    const newVariants: VariantRow[] = combos.map(combo => {
      const attrMap: Record<string, string> = {};
      validAttrs.forEach((a, i) => { attrMap[a.name] = combo[i]; });
      const suffix = combo.map(v => slugify(v)).join("-");
      const existing = variants.find(v =>
        JSON.stringify(v.attributes) === JSON.stringify(attrMap)
      );
      return {
        id: existing?.id ?? uid(),
        attributes: attrMap,
        sku: existing?.sku ?? `${baseSku}-${suffix}`,
        price: existing?.price ?? price,
        stock: existing?.stock ?? "0",
        status: existing?.status ?? "ACTIVE",
        imageUrl: existing?.imageUrl ?? "",
      };
    });
    setVariants(newVariants);
  }, [attrs, sku, price, variants]);

  const updateVariant = (id: string, field: keyof VariantRow, val: string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v));
  };

  /* ── tags ── */
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  /* ── save ── */
  async function handleSave() {
    if (!name.trim()) { setError("Product name is required"); return; }
    if (!sku.trim()) { setError("SKU is required"); return; }
    if (!category) { setError("Category is required"); return; }
    if (!price || isNaN(Number(price))) { setError("Valid price is required"); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        category,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : null,
        description: description.trim() || null,
        tags,
        status,
        imageUrls: imageUrls.filter(u => u.trim()),
        stock: 0,
        trackStock,
        lowStockAlert: Number(lowStockAlert) || 5,
        internalNote: internalNote.trim() || null,
        attributes: attrs.filter(a => a.name && a.values.length).map(a => ({ name: a.name, values: a.values })),
        variants: variants.map(v => ({
          attributes: v.attributes,
          sku: v.sku,
          price: Number(v.price) || Number(price),
          stock: Number(v.stock) || 0,
          status: v.status,
          imageUrl: v.imageUrl || null,
        })),
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      router.push("/products");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const attrLabelColors = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#38bdf8"];

  return (
    <div style={{ height: "100%", background: "#080D27", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/products")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6, padding: 0, fontSize: 13 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back to Products
          </button>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Add Product</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push("/products")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#4f46e5" : "#6366f1", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, color: "#fff", cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save Product"}
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

          {/* 1. Basic Info */}
          <Section num={1} title="Basic Information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Product Name" required>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Premium Cotton Dress" style={inputStyle} />
              </Field>
              <Field label="SKU / Product ID" required>
                <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. PCD-001" style={inputStyle} />
              </Field>
              <Field label="Category" required>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Regular Price (৳)" required>
                  <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="1,450" style={inputStyle} />
                </Field>
                <Field label="Sale Price (৳)">
                  <input value={salePrice} onChange={e => setSalePrice(e.target.value)} type="number" placeholder="1,250" style={inputStyle} />
                </Field>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label="Description">
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Product description…" style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
            </div>
          </Section>

          {/* 2. Product Images */}
          <Section num={2} title="Product Images">
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              Upload or paste URL (up to 10 images). First image = main image.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
              {imageUrls.map((url, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  {url ? (
                    <div style={{ position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <button
                        onClick={() => triggerFileUpload(idx)}
                        title="Replace image"
                        style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.65)", border: "none", borderRadius: 5, cursor: "pointer", color: "#fff", padding: "3px 7px", fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Upload style={{ width: 10, height: 10 }} /> Replace
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploading.includes(idx) && triggerFileUpload(idx)}
                      style={{ width: "100%", height: 110, borderRadius: 8, border: "1px dashed rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 5, cursor: uploading.includes(idx) ? "default" : "pointer", background: "rgba(99,102,241,0.03)" }}
                    >
                      {uploading.includes(idx) ? (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Uploading…</span>
                      ) : (
                        <>
                          <Upload style={{ width: 20, height: 20, color: "rgba(99,102,241,0.6)" }} />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Click to upload</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>or paste URL below</span>
                        </>
                      )}
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
                <button onClick={() => setImageUrls(prev => [...prev, ""])} style={{ height: 110, borderRadius: 8, border: "1px dashed rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.05)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, color: "#818cf8" }}>
                  <Plus style={{ width: 20, height: 20 }} />
                  <span style={{ fontSize: 12 }}>Add Image</span>
                </button>
              )}
            </div>
          </Section>

          {/* 3. Product Attributes */}
          <Section num={3} title="Product Attributes (Variants)">
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              Add attributes like Color, Size, Material. Variants will be auto-generated from combinations.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {attrs.map((attr, idx) => (
                <div key={attr.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "12px" }}>
                  <GripVertical style={{ width: 16, height: 16, color: "rgba(255,255,255,0.2)", marginTop: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      value={attr.name}
                      onChange={e => updateAttrName(attr.id, e.target.value)}
                      placeholder="Attribute name (e.g. Color)"
                      style={{ ...inputStyle, width: 180 }}
                    />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      {attr.values.map(val => (
                        <span key={val} style={{ display: "flex", alignItems: "center", gap: 4, background: `${attrLabelColors[idx % attrLabelColors.length]}22`, border: `1px solid ${attrLabelColors[idx % attrLabelColors.length]}44`, borderRadius: 20, padding: "3px 10px", fontSize: 13, color: attrLabelColors[idx % attrLabelColors.length] }}>
                          {val}
                          <button onClick={() => removeAttrValue(attr.id, val)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: 0, opacity: 0.7 }}>
                            <X style={{ width: 10, height: 10 }} />
                          </button>
                        </span>
                      ))}
                      <div style={{ display: "flex", gap: 4 }}>
                        <input
                          value={attr.inputVal}
                          onChange={e => setAttrs(prev => prev.map(a => a.id === attr.id ? { ...a, inputVal: e.target.value } : a))}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAttrValue(attr.id); } }}
                          placeholder="Add value…"
                          style={{ ...inputStyle, width: 120, padding: "4px 8px", fontSize: 13 }}
                        />
                        <button onClick={() => addAttrValue(attr.id)} style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#a5b4fc", cursor: "pointer" }}>
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeAttr(attr.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, cursor: "pointer", color: "#f87171", padding: 6, display: "flex" }}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button onClick={addAttr} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px dashed rgba(99,102,241,0.4)", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#818cf8", cursor: "pointer" }}>
                <Plus style={{ width: 14, height: 14 }} /> Add Attribute
              </button>
              {attrs.some(a => a.name && a.values.length > 0) && (
                <button onClick={generateVariants} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#a5b4fc", cursor: "pointer", fontWeight: 600 }}>
                  Generate Variants ({attrs.filter(a => a.values.length).reduce((acc, a) => acc * a.values.length, 1)})
                </button>
              )}
            </div>
          </Section>

          {/* 4. Variant Combinations */}
          {variants.length > 0 && (
            <Section num={4} title={`Variant Combinations (${variants.length} variants)`}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>#</th>
                      {attrs.filter(a => a.name && a.values.length).map(a => (
                        <th key={a.id} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{a.name}</th>
                      ))}
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>SKU</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>Price (৳)</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>Stock</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>Status</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>Image URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => (
                      <tr key={v.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "8px 10px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{idx + 1}</td>
                        {attrs.filter(a => a.name && a.values.length).map(a => (
                          <td key={a.id} style={{ padding: "8px 10px", fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>
                            {v.attributes[a.name] ?? "—"}
                          </td>
                        ))}
                        <td style={{ padding: "8px 10px" }}>
                          <input value={v.sku} onChange={e => updateVariant(v.id, "sku", e.target.value)} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12, fontFamily: "monospace", width: 150 }} />
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <input value={v.price} onChange={e => updateVariant(v.id, "price", e.target.value)} type="number" style={{ ...inputStyle, padding: "4px 8px", fontSize: 13, width: 90 }} />
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <input value={v.stock} onChange={e => updateVariant(v.id, "stock", e.target.value)} type="number" style={{ ...inputStyle, padding: "4px 8px", fontSize: 13, width: 70 }} />
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <select value={v.status} onChange={e => updateVariant(v.id, "status", e.target.value as ProductStatus)} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12, width: 100, appearance: "none" }}>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <VariantImagePicker
                            value={v.imageUrl}
                            imageUrls={imageUrls}
                            onChange={url => updateVariant(v.id, "imageUrl", url)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Bulk Edit Panel */}
              <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", marginBottom: 12 }}>BULK EDIT</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>

                  {/* Bulk Price */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>Price ৳</span>
                    <input
                      value={bulkPrice}
                      onChange={e => setBulkPrice(e.target.value)}
                      type="number"
                      placeholder="1200"
                      style={{ ...inputStyle, width: 85, padding: "5px 8px", fontSize: 13 }}
                    />
                    <button
                      onClick={() => { if (bulkPrice !== "") setVariants(prev => prev.map(v => ({ ...v, price: bulkPrice }))); }}
                      style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#a5b4fc", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Apply
                    </button>
                  </div>

                  <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

                  {/* Bulk Stock */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>Stock</span>
                    <input
                      value={bulkStock}
                      onChange={e => setBulkStock(e.target.value)}
                      type="number"
                      placeholder="0"
                      style={{ ...inputStyle, width: 65, padding: "5px 8px", fontSize: 13 }}
                    />
                    <button
                      onClick={() => { if (bulkStock !== "") setVariants(prev => prev.map(v => ({ ...v, stock: bulkStock }))); }}
                      style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#a5b4fc", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Apply
                    </button>
                  </div>

                  <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

                  {/* Bulk SKU */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>SKU Base</span>
                    <input
                      value={bulkSkuBase}
                      onChange={e => setBulkSkuBase(e.target.value)}
                      placeholder="PROD-001"
                      style={{ ...inputStyle, width: 100, padding: "5px 8px", fontSize: 13, fontFamily: "monospace" }}
                    />
                    <button
                      onClick={() => {
                        const base = bulkSkuBase.trim().toUpperCase();
                        if (base) setVariants(prev => prev.map(v => ({
                          ...v,
                          sku: `${base}-${Object.values(v.attributes).map(val => slugify(val)).join("-")}`,
                        })));
                      }}
                      style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#a5b4fc", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Apply
                    </button>
                  </div>

                  <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />

                  {/* Bulk Status */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setVariants(prev => prev.map(v => ({ ...v, status: "ACTIVE" })))}
                      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#4ade80", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      All Active
                    </button>
                    <button
                      onClick={() => setVariants(prev => prev.map(v => ({ ...v, status: "INACTIVE" })))}
                      style={{ background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.2)", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#9ca3af", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      All Inactive
                    </button>
                  </div>
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Product Status */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚙</span> Product Status
            </h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: status === "ACTIVE" ? "#4ade80" : "#9ca3af" }}>
                  {status === "ACTIVE" ? "Active" : "Inactive"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  {status === "ACTIVE" ? "Product will be visible" : "Product is hidden"}
                </div>
              </div>
              <button
                onClick={() => setStatus(s => s === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                  background: status === "ACTIVE" ? "#16a34a" : "rgba(255,255,255,0.15)",
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <span style={{
                  position: "absolute", top: 3, left: status === "ACTIVE" ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          </div>

          {/* Inventory Settings */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>📦</span> Inventory Settings
            </h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Track Stock</label>
              <button
                onClick={() => setTrackStock(t => !t)}
                style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: trackStock ? "#16a34a" : "rgba(255,255,255,0.15)", position: "relative" }}
              >
                <span style={{ position: "absolute", top: 3, left: trackStock ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </button>
            </div>
            <Field label="Low Stock Alert">
              <input value={lowStockAlert} onChange={e => setLowStockAlert(e.target.value)} type="number" placeholder="5" style={{ ...inputStyle, padding: "7px 10px" }} />
            </Field>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Alert when stock is below this number.</p>
          </div>

          {/* Tags */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🏷</span> Tags <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(Optional)</span>
            </h3>
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
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="e.g. Cotton, Summer"
                style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }}
              />
              <button onClick={addTag} style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#a5b4fc", cursor: "pointer" }}>
                Add
              </button>
            </div>
          </div>

          {/* Internal Notes */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>📝</span> Internal Notes <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(Optional)</span>
            </h3>
            <textarea
              value={internalNote}
              onChange={e => setInternalNote(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this product…"
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>This note is only visible to your team.</p>
          </div>

          {/* Save button (bottom) */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: saving ? "#4f46e5" : "#6366f1", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: 700, color: "#fff", cursor: saving ? "default" : "pointer", width: "100%", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
