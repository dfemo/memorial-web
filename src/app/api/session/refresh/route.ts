import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  REFRESH_COOKIE,
  apiBase,
  applySessionCookies,
  clearSessionCookies,
} from "@/lib/api-v1";

export async function GET(request: Request) {
  const url = new URL(request.url);
  let next = url.searchParams.get("next") || "/dashboard";
  if (!next.startsWith("/")) next = "/dashboard";
  // Mark destination so middleware does not immediately re-enter refresh.
  const dest = new URL(next, request.url);
  dest.searchParams.set("_sr", "1");

  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    const response = NextResponse.redirect(
      new URL(`/sign-in?next=${encodeURIComponent(next)}`, request.url),
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
          `/sign-in?next=${encodeURIComponent(next)}&error=${encodeURIComponent(data.error || "Session expired")}`,
          request.url,
        ),
      );
      clearSessionCookies(response, request);
      return response;
    }

    const response = NextResponse.redirect(dest);
    applySessionCookies(response, request, data.accessToken, data.refreshToken);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    const response = NextResponse.redirect(
      new URL(
        `/sign-in?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Could not refresh session")}`,
        request.url,
      ),
    );
    clearSessionCookies(response, request);
    return response;
  }
}
