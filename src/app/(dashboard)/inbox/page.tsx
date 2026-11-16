import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InboxView } from "@/components/inbox-view";

export default async function InboxPage() {
  const session = await auth();

  const accounts = await db.connectedAccount.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <InboxView
      conversations={[]}
      accounts={accounts}
      currentUser={session!.user}
    />
  );
}
