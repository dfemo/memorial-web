/** Sliding idle session: logout after inactivity. Token cookies live longer than idle. */
export const SESSION_IDLE_SECONDS = 60 * 60; // 60 minutes of inactivity
export const SESSION_IDLE_MS = SESSION_IDLE_SECONDS * 1000;
/** Browser cookie lifetime — must cover refresh JWT (7 days). */
export const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

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
  maxAge = SESSION_COOKIE_MAX_AGE,
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

/** Edge-safe JWT payload decode (no signature verify) — middleware scheduling only. */
export function jwtExpiresAt(token: string | undefined): number | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export function isJwtExpiringSoon(token: string | undefined, withinSeconds = 120): boolean {
  const exp = jwtExpiresAt(token);
  // Missing exp → do not force endless refresh loops; treat as not soon-expiring.
  if (exp == null) return false;
  return exp * 1000 <= Date.now() + withinSeconds * 1000;
}

export function isJwtExpired(token: string | undefined): boolean {
  const exp = jwtExpiresAt(token);
  if (exp == null) return !token;
  return exp * 1000 <= Date.now();
}
