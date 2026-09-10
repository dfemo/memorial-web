import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS = "er_access";
const REFRESH = "er_refresh";

const PROTECTED = ["/dashboard", "/create", "/memorial/manage"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hasAccess = Boolean(request.cookies.get(ACCESS)?.value);
  const hasRefresh = Boolean(request.cookies.get(REFRESH)?.value);

  if (pathname === "/sign-in" || pathname === "/sign-up") {
    const next = searchParams.get("next");
    const dest = next && next.startsWith("/") ? next : "/dashboard";
    if (hasAccess) {
      return NextResponse.redirect(new URL(dest, request.url));
    }
    if (hasRefresh) {
      return NextResponse.redirect(
        new URL(`/api/session/refresh?next=${encodeURIComponent(dest)}`, request.url),
      );
    }
    return NextResponse.next();
  }

  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (needsAuth && !hasAccess && !hasRefresh) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (needsAuth && !hasAccess && hasRefresh) {
    return NextResponse.redirect(
      new URL(`/api/session/refresh?next=${encodeURIComponent(pathname)}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/create", "/memorial/manage/:path*", "/sign-in", "/sign-up"],
};
