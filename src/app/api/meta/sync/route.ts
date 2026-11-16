import { NextRequest, NextResponse } from "next/server";
import { syncAllMessages } from "@/lib/sync-messages";
import { getAuthToken } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const totalSynced = await syncAllMessages();
    return NextResponse.json({ synced: totalSynced });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
