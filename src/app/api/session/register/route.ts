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

export async function POST(request: Request) {
  const form = await request.formData();
  const body = {
    firstName: String(form.get("firstName") || ""),
    lastName: String(form.get("lastName") || ""),
    email: String(form.get("email") || "").trim(),
    password: String(form.get("password") || ""),
  };
  const next = String(form.get("next") || "/create");
  const safeNext = next.startsWith("/") ? next : "/create";

  try {
    let res: Response;
    try {
      res = await fetch(`${apiBase()}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch {
      throw new Error(`Cannot reach platform API at ${apiBase()}. Check PLATFORM_API_URL.`);
    }

    const data = (await res.json().catch(() => ({}))) as {
      accessToken?: string;
      refreshToken?: string;
      error?: string;
      message?: string;
    };

    if (!res.ok || !data.accessToken || !data.refreshToken) {
      throw new Error(data.error || data.message || `Sign-up failed (${res.status})`);
    }

    const response = NextResponse.redirect(new URL(safeNext, request.url), 303);
    setSessionCookies(response, request, data.accessToken, data.refreshToken);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign-up failed";
    return NextResponse.redirect(
      new URL(`/sign-up?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }
}
