import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  ACTIVITY_COOKIE,
  AUTH_FLAG_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE_MAX_AGE,
  SESSION_IDLE_MS,
  isJwtExpired,
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

function touchActivity(request: NextRequest, response: NextResponse) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return;

  const opts = sessionCookieOptions(request, SESSION_COOKIE_MAX_AGE);
  // Only rewrite cookie lifetimes / activity — never pretend JWTs were renewed here.
  if (access) response.cookies.set(ACCESS_COOKIE, access, opts);
  if (refresh) response.cookies.set(REFRESH_COOKIE, refresh, opts);
  response.cookies.set(AUTH_FLAG_COOKIE, "1", { ...opts, httpOnly: false });
  response.cookies.set(ACTIVITY_COOKIE, String(Date.now()), { ...opts, httpOnly: false });
}

function needsAuth(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/create" ||
    pathname.startsWith("/memorial/manage/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/session") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (pathname === "/sign-in" || pathname === "/sign-up") {
    // Already signed in → send to intended destination (unless showing an error).
    const access = request.cookies.get(ACCESS_COOKIE)?.value;
    const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
    const hasError = Boolean(request.nextUrl.searchParams.get("error"));
    if ((access || refresh) && !hasError) {
      const next = request.nextUrl.searchParams.get("next");
      const dest = next && next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const activityRaw = request.cookies.get(ACTIVITY_COOKIE)?.value;
  const activity = activityRaw ? Number(activityRaw) : 0;
  const idleTooLong = activity > 0 && Date.now() - activity > SESSION_IDLE_MS;

  if (needsAuth(pathname)) {
    if (idleTooLong) {
      return clearAndSignIn(request, pathname + request.nextUrl.search);
    }

    if (!access && !refresh) {
      return clearAndSignIn(request, pathname + request.nextUrl.search);
    }

    const accessUnusable = !access || isJwtExpired(access) || isJwtExpiringSoon(access, 120);
    const alreadyRefreshed = request.nextUrl.searchParams.get("_sr") === "1";

    // Always refresh when access is unusable and we still have a refresh token.
    // If we just refreshed and still have no usable access, force sign-in (avoid loops).
    if (accessUnusable && refresh) {
      if (alreadyRefreshed && !access) {
        return clearAndSignIn(request, pathname);
      }
      if (!alreadyRefreshed) {
        const returnTo = pathname + request.nextUrl.search;
        const refreshUrl = request.nextUrl.clone();
        refreshUrl.pathname = "/api/session/refresh";
        refreshUrl.search = `?next=${encodeURIComponent(returnTo)}`;
        return NextResponse.redirect(refreshUrl);
      }
    }

    if (!access && !refresh) {
      return clearAndSignIn(request, pathname);
    }

    const res = NextResponse.next();
    if (alreadyRefreshed) {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete("_sr");
      const redirectClean = NextResponse.redirect(clean);
      touchActivity(request, redirectClean);
      return redirectClean;
    }
    touchActivity(request, res);
    return res;
  }

  // Public pages: keep session warm so returning to dashboard does not look "idle".
  if (access || refresh) {
    if (idleTooLong) {
      // Soft clear without redirect — public page still works.
      const res = NextResponse.next();
      const cleared = sessionCookieOptions(request, 0);
      res.cookies.set(ACCESS_COOKIE, "", cleared);
      res.cookies.set(REFRESH_COOKIE, "", cleared);
      res.cookies.set(AUTH_FLAG_COOKIE, "", { ...cleared, httpOnly: false });
      res.cookies.set(ACTIVITY_COOKIE, "", { ...cleared, httpOnly: false });
      return res;
    }
    const res = NextResponse.next();
    touchActivity(request, res);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
