import { NextResponse } from "next/server";
import { apiBase, applySessionCookies, clearSessionCookies } from "@/lib/api-v1";

export async function POST(request: Request) {
  const form = await request.formData();
  const accountTypeRaw = String(form.get("accountType") || "OWNER").trim().toUpperCase();
  const accountType = accountTypeRaw === "VENDOR" ? "VENDOR" : "OWNER";
  const body = {
    firstName: String(form.get("firstName") || ""),
    lastName: String(form.get("lastName") || ""),
    email: String(form.get("email") || "").trim(),
    password: String(form.get("password") || ""),
    accountType,
  };
  const requestedNext = String(form.get("next") || "");
  const defaultNext = accountType === "VENDOR" ? "/dashboard/vendor" : "/create";
  const next = requestedNext.startsWith("/") ? requestedNext : defaultNext;
  // Owners shouldn't land on vendor workspace by accident; vendors shouldn't land on /create.
  const safeNext =
    accountType === "VENDOR"
      ? next === "/create" || next === "/dashboard"
        ? "/dashboard/vendor"
        : next
      : next.startsWith("/dashboard/vendor")
        ? "/create"
        : next;

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
    applySessionCookies(response, request, data.accessToken, data.refreshToken);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign-up failed";
    const asParam = accountType === "VENDOR" ? "&as=vendor" : "";
    const response = NextResponse.redirect(
      new URL(
        `/sign-up?error=${encodeURIComponent(message)}&next=${encodeURIComponent(safeNext)}${asParam}`,
        request.url,
      ),
      303,
    );
    clearSessionCookies(response, request);
    return response;
  }
}
