import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appId = process.env.META_APP_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/meta/callback`;

  if (!appId || appId === "your-meta-app-id") {
    return NextResponse.json({ error: "META_APP_ID not configured" }, { status: 400 });
  }

  const scopes = [
    "pages_messaging",
    "pages_show_list",
    "pages_read_engagement",
    "instagram_basic",
    "instagram_manage_messages",
    "business_management",
  ].join(",");

  const state = randomBytes(16).toString("hex");
  (await cookies()).set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NEXTAUTH_URL?.startsWith("https://"),
    maxAge: 600, // 10 minutes
    path: "/",
    sameSite: "lax",
  });

  const url =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&state=${state}`;

  return NextResponse.json({ url });
}
