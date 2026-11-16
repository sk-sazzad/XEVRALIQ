import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthToken } from "@/lib/api-auth";

export async function proxy(request: NextRequest) {
  const token = await getAuthToken(request);
  const isLoggedIn = !!token;
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/inbox", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand/|manifest.json|sw.js|uploads/).*)"],
};
