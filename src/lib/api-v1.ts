import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  ACTIVITY_COOKIE,
  AUTH_FLAG_COOKIE,
  REFRESH_COOKIE,
  SESSION_IDLE_SECONDS,
  sessionCookieOptions,
  type CookieWriteOptions,
} from "@/lib/session";

export {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  AUTH_FLAG_COOKIE as AUTH_HINT_COOKIE,
  ACTIVITY_COOKIE,
  SESSION_IDLE_SECONDS,
  SESSION_IDLE_MS,
} from "@/lib/session";

export type ApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  plan: string;
  profileImage?: string | null;
};

export type Memorial = {
  id: string;
  slug: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  displayName: string;
  dateOfBirth?: string | null;
  dateOfDeath?: string | null;
  biography?: string | null;
  serviceInfo?: string | null;
  profilePhotoUrl?: string | null;
  coverPhotoUrl?: string | null;
  location?: string | null;
  privacyLevel: string;
  published: boolean;
  featured: boolean;
  plan: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type MemorialDetail = {
  memorial: Memorial;
  tributes: Array<{
    id: string;
    authorName: string;
    message: string;
    photoUrl?: string | null;
    status: string;
    createdAt: string;
  }>;
  stories: Array<{
    id: string;
    title: string;
    content: string;
    status: string;
    createdAt: string;
  }>;
  photos: Array<{
    id: string;
    url: string;
    thumbnailUrl?: string | null;
    caption?: string | null;
    sortOrder: number;
  }>;
  contributors: Array<{
    id: string;
    userId: string;
    role: string;
    acceptedAt?: string | null;
  }>;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export function apiBase() {
  const base = process.env.PLATFORM_API_URL || "http://localhost:8080";
  return base.replace(/\/$/, "");
}

/** @deprecated use sessionCookieOptions */
export function authCookieOptions(maxAge: number): CookieWriteOptions {
  return sessionCookieOptions({ url: "https://local" }, maxAge);
}

/** @deprecated use sessionCookieOptions */
export function authCookieOptionsForRequest(
  request: Request,
  maxAge: number,
  overrides: Partial<CookieWriteOptions> = {},
): CookieWriteOptions {
  return sessionCookieOptions(request, maxAge, overrides);
}

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

export function applySessionCookies(
  target: {
    cookies: {
      set: (name: string, value: string, options?: CookieWriteOptions) => void;
    };
  },
  request: Request,
  accessToken: string,
  refreshToken: string,
) {
  const opts = sessionCookieOptions(request, SESSION_IDLE_SECONDS);
  target.cookies.set(ACCESS_COOKIE, accessToken, opts);
  target.cookies.set(REFRESH_COOKIE, refreshToken, opts);
  target.cookies.set(AUTH_FLAG_COOKIE, "1", { ...opts, httpOnly: false });
  target.cookies.set(ACTIVITY_COOKIE, String(Date.now()), { ...opts, httpOnly: false });
}

export function clearSessionCookies(
  target: {
    cookies: {
      set: (name: string, value: string, options?: CookieWriteOptions) => void;
    };
  },
  request: Request,
) {
  const cleared = sessionCookieOptions(request, 0);
  target.cookies.set(ACCESS_COOKIE, "", cleared);
  target.cookies.set(REFRESH_COOKIE, "", cleared);
  target.cookies.set(AUTH_FLAG_COOKIE, "", { ...cleared, httpOnly: false });
  target.cookies.set(ACTIVITY_COOKIE, "", { ...cleared, httpOnly: false });
}

/** @deprecated */
export function applyAuthCookies(
  target: {
    cookies: {
      set: (name: string, value: string, options?: CookieWriteOptions) => void;
    };
  },
  accessToken: string,
  refreshToken: string,
) {
  applySessionCookies(target, { url: "https://local" } as Request, accessToken, refreshToken);
}

/** @deprecated */
export function clearAuthCookiesOn(
  target: {
    cookies: {
      set: (name: string, value: string, options?: CookieWriteOptions) => void;
    };
  },
) {
  clearSessionCookies(target, { url: "https://local" } as Request);
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  const opts = sessionCookieOptions({ url: process.env.AUTH_URL || "https://local" }, SESSION_IDLE_SECONDS);
  jar.set(ACCESS_COOKIE, accessToken, opts);
  jar.set(REFRESH_COOKIE, refreshToken, opts);
  jar.set(AUTH_FLAG_COOKIE, "1", { ...opts, httpOnly: false });
  jar.set(ACTIVITY_COOKIE, String(Date.now()), { ...opts, httpOnly: false });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(AUTH_FLAG_COOKIE);
  jar.delete(ACTIVITY_COOKIE);
}

export async function apiV1<T>(
  path: string,
  init: RequestInit & { auth?: boolean; token?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = init.token ?? (init.auth === false ? undefined : await getAccessToken());
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      503,
      `Cannot reach platform API at ${apiBase()}. Set PLATFORM_API_URL on memorial-web.`,
    );
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error) message = body.error;
      else if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
