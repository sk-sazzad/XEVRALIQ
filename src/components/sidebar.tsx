"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Inbox, Settings, LogOut, User, ShoppingCart, Package, ChevronDown, ChevronRight, Plus, Users } from "lucide-react";

/* ── Platform icons ───────────────────────────────────────────── */
function FbIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function IgIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function WaIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* ── Types ────────────────────────────────────────────────────── */
interface Account {
  id: string;
  platform: string;
  pageId: string;
  pageName: string;
  profilePic: string | null;
}

interface SidebarUser {
  name?: string | null;
  email?: string | null;
}

interface SidebarProps {
  user: SidebarUser;
  accounts: Account[];
}

/* ── Channel platform config ──────────────────────────────────── */
const CHANNELS = [
  {
    key: "FACEBOOK",
    label: "Facebook",
    color: "#2563eb",
    Icon: FbIcon,
    bgStyle: { backgroundColor: "#2563eb" },
  },
  {
    key: "INSTAGRAM",
    label: "Instagram",
    color: "#ec4899",
    Icon: IgIcon,
    bgStyle: { background: "linear-gradient(135deg,#a855f7,#ec4899)" },
  },
  {
    key: "WHATSAPP",
    label: "WhatsApp",
    color: "#22c55e",
    Icon: WaIcon,
    bgStyle: { backgroundColor: "#22c55e" },
  },
];

/* ── Sidebar ──────────────────────────────────────────────────── */
export function Sidebar({ user, accounts }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeAccountId = searchParams.get("accountId");

  // each channel can be expanded or collapsed
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    FACEBOOK: true,
    INSTAGRAM: true,
    WHATSAPP: false,
  });

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const isInboxActive = pathname === "/inbox" && !activeAccountId;

  return (
    <aside className="hidden md:flex md:w-14 xl:w-64 bg-[#0A0F2E] border-r border-white/10 flex-col shrink-0 transition-all duration-200">

      {/* Logo */}
      <div className="px-2 xl:px-4 py-4 border-b border-white/10">
        <Link href="/inbox" className="flex items-center justify-center xl:justify-start gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/orbit-x.png" alt="XEVRALIQ" className="w-8 h-8 rounded-xl object-cover shrink-0" />
          <span className="hidden xl:inline font-bold text-white tracking-wide text-sm">XEVRALIQ</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 xl:px-3 py-4 overflow-y-auto space-y-1">

        {/* ── INBOX ─────────────────────────────────────────── */}
        <p className="hidden xl:block px-2 pb-1 text-xs font-medium text-white/40 uppercase tracking-wider">Inbox</p>

        <Link
          href="/inbox"
          title="All Messages"
          className={`flex items-center justify-center xl:justify-start gap-3 px-2 xl:px-3 py-2.5 xl:py-2 rounded-lg text-sm font-medium transition-colors ${
            isInboxActive
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
              : "text-white/60 hover:bg-white/8 hover:text-white"
          }`}
        >
          <Inbox className="w-5 h-5 xl:w-4 xl:h-4 shrink-0" />
          <span className="hidden xl:inline">All Messages</span>
        </Link>

        {/* ── CHANNELS ──────────────────────────────────────── */}
        <div className="pt-3">
          <p className="hidden xl:block px-2 pb-1 text-xs font-medium text-white/40 uppercase tracking-wider">Channels</p>

          {CHANNELS.map((ch) => {
            const channelAccounts = accounts.filter((a) => a.platform === ch.key);
            const isOpen = expanded[ch.key];

            return (
              <div key={ch.key} className="mb-0.5">
                {/* Platform row */}
                <div className="flex items-center justify-center xl:justify-between">
                  <button
                    onClick={() => toggle(ch.key)}
                    title={ch.label}
                    className="flex items-center justify-center xl:justify-start gap-2.5 flex-1 px-2 xl:px-3 py-2 xl:py-1.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-colors"
                  >
                    {/* Platform icon badge */}
                    <span
                      className="w-5 h-5 xl:w-4 xl:h-4 rounded-md flex items-center justify-center shrink-0 text-white"
                      style={ch.bgStyle}
                    >
                      <ch.Icon size={10} />
                    </span>
                    <span className="hidden xl:flex xl:items-center xl:gap-1.5 flex-1 min-w-0">
                      <span className="truncate">{ch.label}</span>
                      {channelAccounts.length > 0 && (
                        <span className="text-xs text-white/30 shrink-0">({channelAccounts.length})</span>
                      )}
                    </span>
                    {/* Expand/collapse arrow — desktop only */}
                    <span className="hidden xl:block shrink-0 text-white/30">
                      {isOpen
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />
                      }
                    </span>
                  </button>
                </div>

                {/* Sub-accounts — desktop expanded */}
                {isOpen && (
                  <div className="hidden xl:block ml-3 pl-3 border-l border-white/10 mt-0.5 space-y-0.5">
                    {channelAccounts.length === 0 ? (
                      ch.key === "WHATSAPP" ? (
                        <p className="px-2 py-1.5 text-xs text-white/25 italic">Coming soon</p>
                      ) : (
                        <Link
                          href="/settings"
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-white/30 hover:text-indigo-300 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Connect {ch.label}
                        </Link>
                      )
                    ) : (
                      channelAccounts.map((acc) => {
                        const isActive = activeAccountId === acc.id;
                        return (
                          <Link
                            key={acc.id}
                            href={`/inbox?accountId=${acc.id}`}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isActive
                                ? "bg-indigo-600/20 text-indigo-300"
                                : "text-white/50 hover:bg-white/8 hover:text-white"
                            }`}
                          >
                            {acc.profilePic ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={acc.profilePic} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                            ) : (
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white"
                                style={ch.bgStyle}
                              >
                                <ch.Icon size={9} />
                              </span>
                            )}
                            <span className="truncate">{acc.pageName}</span>
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Active" />
                          </Link>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── MANAGEMENT ────────────────────────────────────── */}
        <div className="pt-3">
          <p className="hidden xl:block px-2 pb-1 text-xs font-medium text-white/40 uppercase tracking-wider">Management</p>
          <Link
            href="/orders"
            title="Orders"
            className={`flex items-center justify-center xl:justify-start gap-3 px-2 xl:px-3 py-2.5 xl:py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/orders"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            <ShoppingCart className="w-5 h-5 xl:w-4 xl:h-4 shrink-0" />
            <span className="hidden xl:inline">Orders</span>
          </Link>
          <Link
            href="/products"
            title="Products"
            className={`flex items-center justify-center xl:justify-start gap-3 px-2 xl:px-3 py-2.5 xl:py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/products"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Package className="w-5 h-5 xl:w-4 xl:h-4 shrink-0" />
            <span className="hidden xl:inline">Products</span>
          </Link>
          <Link
            href="/team"
            title="Team"
            className={`flex items-center justify-center xl:justify-start gap-3 px-2 xl:px-3 py-2.5 xl:py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/team"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Users className="w-5 h-5 xl:w-4 xl:h-4 shrink-0" />
            <span className="hidden xl:inline">Team</span>
          </Link>
        </div>

        {/* ── SETTINGS ──────────────────────────────────────── */}
        <div className="pt-2">
          <p className="hidden xl:block px-2 pb-1 text-xs font-medium text-white/40 uppercase tracking-wider">Settings</p>
          <Link
            href="/settings"
            title="Settings"
            className={`flex items-center justify-center xl:justify-start gap-3 px-2 xl:px-3 py-2.5 xl:py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/settings"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Settings className="w-5 h-5 xl:w-4 xl:h-4 shrink-0" />
            <span className="hidden xl:inline">Settings</span>
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="px-2 xl:px-3 py-3 border-t border-white/10">
        <div className="hidden xl:flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-indigo-600/30 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/40">
              <User className="w-3.5 h-3.5 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name ?? "Admin"}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="xl:hidden flex flex-col items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600/30 rounded-full flex items-center justify-center border border-indigo-500/40">
            <User className="w-3.5 h-3.5 text-indigo-300" />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
