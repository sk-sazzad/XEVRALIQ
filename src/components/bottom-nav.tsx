"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, ShoppingCart, Package, Users, Settings } from "lucide-react";
import { useEffect, useState } from "react";

const items = [
  { href: "/inbox", Icon: Inbox, label: "Inbox" },
  { href: "/orders", Icon: ShoppingCart, label: "Orders" },
  { href: "/products", Icon: Package, label: "Products" },
  { href: "/team", Icon: Users, label: "Team" },
  { href: "/settings", Icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => setHidden((e as CustomEvent<boolean>).detail);
    window.addEventListener("inbox:view", handler);
    return () => window.removeEventListener("inbox:view", handler);
  }, []);

  if (hidden) return null;

  return (
    <nav
      className="flex md:hidden"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "#0A0F2E",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {items.map(({ href, Icon, label }) => {
        const isActive = pathname === href || (href === "/inbox" && pathname.startsWith("/inbox"));
        return (
          <Link
            key={href}
            href={href}
            style={{ color: isActive ? "#818cf8" : "rgba(255,255,255,0.4)" }}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
          >
            <Icon style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: 10 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
