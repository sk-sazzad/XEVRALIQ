import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export function getAuthToken(request: NextRequest) {
  const secureCookie = process.env.NEXTAUTH_URL?.startsWith("https://");
  const cookieName = secureCookie ? "__Secure-authjs.session-token" : "authjs.session-token";
  return getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, cookieName });
}
