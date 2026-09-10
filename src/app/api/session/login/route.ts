import { NextResponse } from "next/server";
import { apiBase, applyAuthCookies, clearAuthCookiesOn } from "@/lib/api-v1";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/dashboard");
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  try {
    let res: Response;
    try {
      res = await fetch(`${apiBase()}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
      throw new Error(data.error || data.message || `Sign-in failed (${res.status})`);
    }

    const response = NextResponse.redirect(new URL(safeNext, request.url), 303);
    applyAuthCookies(response, data.accessToken, data.refreshToken);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign-in failed";
    const response = NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent(message)}&next=${encodeURIComponent(safeNext)}`,
        request.url,
      ),
      303,
    );
    clearAuthCookiesOn(response);
    return response;
  }
}
