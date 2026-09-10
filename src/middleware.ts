import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  ACTIVITY_COOKIE,
  AUTH_FLAG_COOKIE,
  REFRESH_COOKIE,
  SESSION_IDLE_MS,
  SESSION_IDLE_SECONDS,
  isJwtExpiringSoon,
  sessionCookieOptions,
} from "@/lib/session";

function clearAndSignIn(request: NextRequest, nextPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = `?next=${encodeURIComponent(nextPath)}`;
  const res = NextResponse.redirect(url);
  const cleared = sessionCookieOptions(request, 0);
  res.cookies.set(ACCESS_COOKIE, "", cleared);
  res.cookies.set(REFRESH_COOKIE, "", cleared);
  res.cookies.set(AUTH_FLAG_COOKIE, "", { ...cleared, httpOnly: false });
  res.cookies.set(ACTIVITY_COOKIE, "", { ...cleared, httpOnly: false });
  return res;
}

function slideSessionCookies(request: NextRequest, response: NextResponse) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return;

  const opts = sessionCookieOptions(request, SESSION_IDLE_SECONDS);
  if (access) response.cookies.set(ACCESS_COOKIE, access, opts);
  if (refresh) response.cookies.set(REFRESH_COOKIE, refresh, opts);
  response.cookies.set(AUTH_FLAG_COOKIE, "1", { ...opts, httpOnly: false });
  response.cookies.set(ACTIVITY_COOKIE, String(Date.now()), { ...opts, httpOnly: false });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/sign-in" || pathname === "/sign-up") {
    return NextResponse.next();
  }

  const needsAuth =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/create" ||
    pathname.startsWith("/memorial/manage/");

  if (!needsAuth) return NextResponse.next();

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const activityRaw = request.cookies.get(ACTIVITY_COOKIE)?.value;
  const activity = activityRaw ? Number(activityRaw) : 0;
  const idleTooLong = activity > 0 && Date.now() - activity > SESSION_IDLE_MS;

  if (idleTooLong) {
    return clearAndSignIn(request, pathname);
  }

  if (!access && !refresh) {
    return clearAndSignIn(request, pathname);
  }

  // Access missing or JWT nearly expired → silent refresh (once).
  const alreadyRefreshed = request.nextUrl.searchParams.get("_sr") === "1";
  if ((!access || isJwtExpiringSoon(access, 120)) && refresh && !alreadyRefreshed) {
    const returnTo = pathname + request.nextUrl.search;
    const refreshUrl = request.nextUrl.clone();
    refreshUrl.pathname = "/api/session/refresh";
    refreshUrl.search = `?next=${encodeURIComponent(returnTo)}`;
    return NextResponse.redirect(refreshUrl);
  }

  if (!access && !refresh) {
    return clearAndSignIn(request, pathname);
  }

  // Slide idle window on every authenticated navigation.
  const res = NextResponse.next();
  // Drop one-time refresh marker from the URL after a successful pass.
  if (alreadyRefreshed) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("_sr");
    const redirectClean = NextResponse.redirect(clean);
    slideSessionCookies(request, redirectClean);
    return redirectClean;
  }
  slideSessionCookies(request, res);
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/create", "/memorial/manage/:path*", "/sign-in", "/sign-up"],
};
