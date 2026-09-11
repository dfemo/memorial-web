import { NextResponse } from "next/server";
import {
  apiBase,
  applySessionCookies,
  clearSessionCookies,
} from "@/lib/api-v1";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/dashboard");
  const requestedNext = next.startsWith("/") ? next : "/dashboard";

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
      user?: { accountType?: string };
    };

    if (!res.ok || !data.accessToken || !data.refreshToken) {
      throw new Error(data.error || data.message || `Sign-in failed (${res.status})`);
    }

    const isVendor = (data.user?.accountType || "OWNER").toUpperCase() === "VENDOR";
    const safeNext =
      isVendor && (requestedNext === "/dashboard" || requestedNext === "/create")
        ? "/dashboard/vendor"
        : !isVendor && requestedNext.startsWith("/dashboard/vendor")
          ? "/dashboard"
          : requestedNext;

    const response = NextResponse.redirect(new URL(safeNext, request.url), 303);
    applySessionCookies(response, request, data.accessToken, data.refreshToken);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign-in failed";
    const response = NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent(message)}&next=${encodeURIComponent(requestedNext)}`,
        request.url,
      ),
      303,
    );
    clearSessionCookies(response, request);
    return response;
  }
}
