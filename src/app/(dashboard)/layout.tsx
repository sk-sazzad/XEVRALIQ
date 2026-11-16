import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const accounts = await db.connectedAccount.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, platform: true, pageId: true, pageName: true, profilePic: true },
  });

  return (
    <div className="flex bg-gray-50 overflow-hidden" style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Sidebar user={session.user} accounts={accounts} />
      <main className="flex-1 overflow-hidden md:!pb-0" style={{ paddingBottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))" }}>{children}</main>
      <BottomNav />
    </div>
  );
}
