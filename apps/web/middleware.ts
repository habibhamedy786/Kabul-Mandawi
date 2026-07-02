import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight route guard. Real role enforcement also happens server-side via
// JWT + RBAC on the API; this just improves UX by redirecting logged-out
// visitors away from protected sections before the page renders.
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

export function middleware(req: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasToken = req.cookies.get("afc_has_session")?.value === "1";
  if (!hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
