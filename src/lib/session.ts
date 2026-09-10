/** Sliding idle session: active while using the app; ends on logout or 20m idle. */
export const SESSION_IDLE_SECONDS = 20 * 60;
export const SESSION_IDLE_MS = SESSION_IDLE_SECONDS * 1000;

export const ACCESS_COOKIE = "er_access";
export const REFRESH_COOKIE = "er_refresh";
export const AUTH_FLAG_COOKIE = "er_auth";
export const ACTIVITY_COOKIE = "er_active";

export type CookieWriteOptions = {
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  secure?: boolean;
  maxAge?: number;
};

export function sessionCookieOptions(
  request: Request | { url: string },
  maxAge = SESSION_IDLE_SECONDS,
  overrides: Partial<CookieWriteOptions> = {},
): CookieWriteOptions {
  let secure = process.env.VERCEL === "1";
  try {
    secure = secure || new URL(request.url).protocol === "https:";
  } catch {
    /* keep vercel default */
  }
  if (process.env.COOKIE_SECURE === "true") secure = true;
  if (process.env.COOKIE_SECURE === "false") secure = false;

  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge,
    ...overrides,
  };
}

/** Decode JWT exp (seconds) without verifying signature — middleware scheduling only. */
export function jwtExpiresAt(token: string | undefined): number | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(
      Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { exp?: number };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

export function isJwtExpiringSoon(token: string | undefined, withinSeconds = 120): boolean {
  const exp = jwtExpiresAt(token);
  if (exp == null) return true;
  return exp * 1000 <= Date.now() + withinSeconds * 1000;
}
