import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;

  // Must be logged in to connect a Facebook account
  const session = await auth();
  if (!session) return NextResponse.redirect(new URL("/login", baseUrl));

  // Verify CSRF state cookie set by /api/meta/auth-url
  const cookieStore = await cookies();
  const savedState = cookieStore.get("meta_oauth_state")?.value;
  const receivedState = request.nextUrl.searchParams.get("state");
  cookieStore.delete("meta_oauth_state");
  if (!savedState || savedState !== receivedState) {
    return NextResponse.redirect(new URL("/settings?error=invalid_state", baseUrl));
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error)}`, baseUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?error=no_code", baseUrl)
    );
  }

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/meta/callback`;

  try {
    // Exchange code for user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
        `?client_id=${appId}` +
        `&client_secret=${appSecret}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    const userToken = tokenData.access_token as string;

    // Get ALL pages this user manages (personal + Business Manager)
    type FBPage = {
      id: string;
      name: string;
      access_token: string;
      picture?: { data: { url: string } };
    };
    const pageMap = new Map<string, FBPage>();

    // 1. Personal admin pages via me/accounts
    let nextUrl: string | null =
      `https://graph.facebook.com/v19.0/me/accounts` +
      `?fields=id,name,access_token,picture` +
      `&limit=100` +
      `&access_token=${userToken}`;
    while (nextUrl) {
      const res = await fetch(nextUrl);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      for (const p of data.data ?? []) pageMap.set(p.id, p);
      nextUrl = data.paging?.next ?? null;
    }

    // 2. Business Manager pages via me/businesses → owned_pages
    const bizRes = await fetch(
      `https://graph.facebook.com/v19.0/me/businesses` +
      `?fields=id,name` +
      `&access_token=${userToken}`
    );
    const bizData = await bizRes.json();
    for (const biz of bizData.data ?? []) {
      let bizPagesUrl: string | null =
        `https://graph.facebook.com/v19.0/${biz.id}/owned_pages` +
        `?fields=id,name,access_token,picture` +
        `&limit=100` +
        `&access_token=${userToken}`;
      while (bizPagesUrl) {
        const bpRes = await fetch(bizPagesUrl);
        const bpData = await bpRes.json();
        if (bpData.error) break;
        for (const p of bpData.data ?? []) pageMap.set(p.id, p);
        bizPagesUrl = bpData.paging?.next ?? null;
      }
    }

    const pages = [...pageMap.values()];
    if (pages.length === 0) {
      return NextResponse.redirect(new URL("/settings?error=no_pages_found", baseUrl));
    }

    // Upsert each page as a ConnectedAccount
    for (const page of pages) {
      await db.connectedAccount.upsert({
        where: { pageId: page.id },
        update: {
          pageName: page.name,
          accessToken: page.access_token,
          profilePic: page.picture?.data.url ?? null,
          isActive: true,
        },
        create: {
          platform: "FACEBOOK",
          pageId: page.id,
          pageName: page.name,
          accessToken: page.access_token,
          profilePic: page.picture?.data.url ?? null,
          isActive: true,
        },
      });
    }

    // Also try to get Instagram accounts connected to these pages
    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account{id,name,profile_picture_url}&access_token=${page.access_token}`
      );
      const igData = await igRes.json();
      const ig = igData.instagram_business_account;

      if (ig?.id) {
        await db.connectedAccount.upsert({
          where: { pageId: ig.id },
          update: {
            pageName: ig.name ?? page.name + " (Instagram)",
            accessToken: page.access_token,
            profilePic: ig.profile_picture_url ?? null,
            isActive: true,
          },
          create: {
            platform: "INSTAGRAM",
            pageId: ig.id,
            pageName: ig.name ?? page.name + " (Instagram)",
            accessToken: page.access_token,
            profilePic: ig.profile_picture_url ?? null,
            isActive: true,
          },
        });
      }
    }

    return NextResponse.redirect(
      new URL(`/settings?connected=true&pages=${pages.length}`, baseUrl)
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(msg)}`, baseUrl)
    );
  }
}
