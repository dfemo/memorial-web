import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS = "er_access";
const REFRESH = "er_refresh";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccess = Boolean(request.cookies.get(ACCESS)?.value);
  const hasRefresh = Boolean(request.cookies.get(REFRESH)?.value);

  // Never auto-bounce away from auth pages — prevents refresh/sign-in loops.
  if (pathname === "/sign-in" || pathname === "/sign-up") {
    return NextResponse.next();
  }

  const needsAuth =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/create" ||
    pathname.startsWith("/memorial/manage/");

  if (!needsAuth) return NextResponse.next();

  if (hasAccess) return NextResponse.next();

  if (hasRefresh) {
    const refreshUrl = request.nextUrl.clone();
    refreshUrl.pathname = "/api/session/refresh";
    refreshUrl.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(refreshUrl);
  }

  const signIn = request.nextUrl.clone();
  signIn.pathname = "/sign-in";
  signIn.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/dashboard/:path*", "/create", "/memorial/manage/:path*", "/sign-in", "/sign-up"],
};
