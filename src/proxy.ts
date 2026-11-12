import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/admin", "/dashboard", "/account"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check: protected paths require a session cookie
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtected) {
    // Check for the session cookie (Better Auth uses this pattern)
    const sessionCookie =
      request.cookies.get("youm-el-farah.session_token") ??
      request.cookies.get("__Secure-youm-el-farah.session_token");

    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/account/:path*"],
};

