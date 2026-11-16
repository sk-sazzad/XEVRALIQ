"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Trash2, Shield, UserCheck, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  createdAt: string;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(id: string) {
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6",
    "#f59e0b", "#10b981", "#3b82f6", "#ef4444",
  ];
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "ADMIN";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
        backgroundColor: isAdmin ? "rgba(99,102,241,0.15)" : "rgba(20,184,166,0.12)",
        color: isAdmin ? "#a5b4fc" : "#5eead4",
        border: `1px solid ${isAdmin ? "rgba(99,102,241,0.3)" : "rgba(20,184,166,0.25)"}`,
      }}
    >
      {isAdmin ? <Shield style={{ width: 10, height: 10 }} /> : <UserCheck style={{ width: 10, height: 10 }} />}
      {isAdmin ? "Admin" : "Agent"}
    </span>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingRole, setTogglingRole] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  // invite form
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "AGENT" });
  const [showPw, setShowPw] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      setMembers(data.members ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleInvite() {
    setInviteErr(null);
    setInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setInviteErr(data.error ?? "Failed"); return; }
      setMembers((prev) => [...prev, data.member]);
      setShowInvite(false);
      setForm({ name: "", email: "", password: "", role: "AGENT" });
    } finally {
      setInviting(false);
    }
  }

  async function handleToggleRole(member: Member) {
    setTogglingRole(member.id);
    try {
      const newRole = member.role === "ADMIN" ? "AGENT" : "ADMIN";
      const res = await fetch(`/api/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, role: newRole } : m));
      }
    } finally {
      setTogglingRole(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
      if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div style={{ height: "100%", background: "#080D27", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Member"
        message={`Are you sure you want to remove ${deleteTarget?.name} (${deleteTarget?.email})? They will lose access immediately.`}
        confirmLabel="Remove"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting === deleteTarget?.id}
      />

      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users style={{ width: 18, height: 18, color: "#a5b4fc" }} />
          </div>
          <div>
            <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>Team</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteErr(null); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <Plus style={{ width: 15, height: 15 }} />
          Add Member
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 40px" }}>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
            <Loader2 style={{ width: 24, height: 24, color: "#6366f1", animation: "spin 1s linear infinite" }} />
          </div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60, color: "rgba(255,255,255,0.3)" }}>
            <Users style={{ width: 40, height: 40, margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14 }}>No team members yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 720 }}>
            {members.map((member) => (
              <div
                key={member.id}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: "14px 16px",
                  transition: "background 0.15s",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  background: avatarColor(member.id),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, color: "#fff",
                }}>
                  {initials(member.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                    {member.name}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>
                    {member.email}
                  </p>
                </div>

                {/* Role badge */}
                <RoleBadge role={member.role} />

                {/* Joined */}
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, whiteSpace: "nowrap" }}>
                  {new Date(member.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleToggleRole(member)}
                    disabled={togglingRole === member.id}
                    title={member.role === "ADMIN" ? "Demote to Agent" : "Promote to Admin"}
                    style={{
                      padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent", color: "rgba(255,255,255,0.4)",
                      cursor: "pointer", fontSize: 11, fontWeight: 500,
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    {togglingRole === member.id
                      ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
                      : member.role === "ADMIN" ? "→ Agent" : "→ Admin"
                    }
                  </button>
                  <button
                    onClick={() => setDeleteTarget(member)}
                    disabled={deleting === member.id}
                    title="Remove member"
                    style={{
                      padding: "6px 8px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.2)",
                      background: "transparent", color: "rgba(239,68,68,0.5)",
                      cursor: "pointer", display: "flex", alignItems: "center",
                    }}
                  >
                    {deleting === member.id
                      ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                      : <Trash2 style={{ width: 14, height: 14 }} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div
          onClick={() => setShowInvite(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0E1535", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: 28, width: "100%", maxWidth: 420,
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>Add Team Member</h2>
              <button onClick={() => setShowInvite(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 36px 9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}
                  >
                    {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Role</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["AGENT", "ADMIN"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setForm((f) => ({ ...f, role: r }))}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        border: form.role === r ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.1)",
                        background: form.role === r ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                        color: form.role === r ? "#a5b4fc" : "rgba(255,255,255,0.5)",
                        transition: "all 0.15s",
                      }}
                    >
                      {r === "AGENT" ? "Agent" : "Admin"}
                    </button>
                  ))}
                </div>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 6 }}>
                  {form.role === "ADMIN" ? "Full access to all features and settings." : "Can manage conversations and orders."}
                </p>
              </div>

              {inviteErr && (
                <p style={{ color: "#f87171", fontSize: 12, background: "rgba(239,68,68,0.1)", padding: "8px 12px", borderRadius: 7, margin: 0 }}>{inviteErr}</p>
              )}

              <button
                onClick={handleInvite}
                disabled={inviting || !form.name || !form.email || !form.password}
                style={{
                  padding: "10px 0", background: inviting || !form.name || !form.email || !form.password ? "rgba(99,102,241,0.4)" : "#6366f1",
                  color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: inviting ? "wait" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {inviting && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
                {inviting ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
