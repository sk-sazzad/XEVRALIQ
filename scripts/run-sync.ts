import { syncAllMessages } from "../src/lib/sync-messages";

async function main() {
  console.log("[sync] Starting full message sync...");
  const totalSynced = await syncAllMessages();
  console.log(`[sync] Done! Synced ${totalSynced} new messages.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[sync] Error:", err);
  process.exit(1);
});
