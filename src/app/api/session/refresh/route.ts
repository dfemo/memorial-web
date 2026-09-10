import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  apiBase,
  authCookieOptionsForRequest,
} from "@/lib/api-v1";

function setSessionCookies(
  response: NextResponse,
  request: Request,
  accessToken: string,
  refreshToken: string,
) {
  response.cookies.set(ACCESS_COOKIE, accessToken, authCookieOptionsForRequest(request, 60 * 60 * 8));
  response.cookies.set(
    REFRESH_COOKIE,
    refreshToken,
    authCookieOptionsForRequest(request, 60 * 60 * 24 * 30),
  );
  response.cookies.set(
    "er_auth",
    "1",
    authCookieOptionsForRequest(request, 60 * 60 * 8, { httpOnly: false }),
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  const refreshToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${REFRESH_COOKIE}=`))
    ?.slice(REFRESH_COOKIE.length + 1);

  if (!refreshToken) {
    return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(safeNext)}`, request.url));
  }

  try {
    const res = await fetch(`${apiBase()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: decodeURIComponent(refreshToken) }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      accessToken?: string;
      refreshToken?: string;
      error?: string;
    };
    if (!res.ok || !data.accessToken || !data.refreshToken) {
      const response = NextResponse.redirect(
        new URL(
          `/sign-in?next=${encodeURIComponent(safeNext)}&error=${encodeURIComponent(data.error || "Session expired")}`,
          request.url,
        ),
      );
      response.cookies.set(ACCESS_COOKIE, "", authCookieOptionsForRequest(request, 0));
      response.cookies.set(REFRESH_COOKIE, "", authCookieOptionsForRequest(request, 0));
      response.cookies.set("er_auth", "", authCookieOptionsForRequest(request, 0, { httpOnly: false }));
      return response;
    }

    const response = NextResponse.redirect(new URL(safeNext, request.url));
    setSessionCookies(response, request, data.accessToken, data.refreshToken);
    return response;
  } catch {
    return NextResponse.redirect(
      new URL(
        `/sign-in?next=${encodeURIComponent(safeNext)}&error=${encodeURIComponent("Could not refresh session")}`,
        request.url,
      ),
    );
  }
}
