import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsView } from "@/components/settings-view";

export default async function SettingsPage() {
  const session = await auth();

  const accounts = await db.connectedAccount.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <SettingsView
      accounts={accounts}
      metaAppId={process.env.META_APP_ID ?? ""}
    />
  );
}
