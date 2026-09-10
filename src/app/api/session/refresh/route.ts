import { cookies } from "next/headers";
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
  const accessOpts = authCookieOptionsForRequest(request, 60 * 60 * 8);
  const refreshOpts = authCookieOptionsForRequest(request, 60 * 60 * 24 * 30);
  response.cookies.set(ACCESS_COOKIE, accessToken, accessOpts);
  response.cookies.set(REFRESH_COOKIE, refreshToken, refreshOpts);
  response.cookies.set("er_auth", "1", { ...accessOpts, httpOnly: false });
}

function clearSessionCookies(response: NextResponse, request: Request) {
  const cleared = authCookieOptionsForRequest(request, 0);
  response.cookies.set(ACCESS_COOKIE, "", cleared);
  response.cookies.set(REFRESH_COOKIE, "", cleared);
  response.cookies.set("er_auth", "", { ...cleared, httpOnly: false });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    const response = NextResponse.redirect(
      new URL(`/sign-in?next=${encodeURIComponent(safeNext)}`, request.url),
    );
    clearSessionCookies(response, request);
    return response;
  }

  try {
    const res = await fetch(`${apiBase()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
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
      clearSessionCookies(response, request);
      return response;
    }

    const response = NextResponse.redirect(new URL(safeNext, request.url));
    setSessionCookies(response, request, data.accessToken, data.refreshToken);
    return response;
  } catch {
    const response = NextResponse.redirect(
      new URL(
        `/sign-in?next=${encodeURIComponent(safeNext)}&error=${encodeURIComponent("Could not refresh session")}`,
        request.url,
      ),
    );
    clearSessionCookies(response, request);
    return response;
  }
}
