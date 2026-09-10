import { cookies } from "next/headers";

export const ACCESS_COOKIE = "er_access";
export const REFRESH_COOKIE = "er_refresh";

type CookieWriteOptions = {
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  secure?: boolean;
  maxAge?: number;
};

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

export function authCookieOptions(maxAge: number): CookieWriteOptions {
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    process.env.VERCEL === "1" ||
    process.env.AUTH_URL?.startsWith("https://") === true ||
    process.env.NEXTAUTH_URL?.startsWith("https://") === true;
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge,
  };
}

/** Prefer request protocol so local http and Vercel https both keep the session. */
export function authCookieOptionsForRequest(
  request: Request,
  maxAge: number,
  overrides: Partial<CookieWriteOptions> = {},
): CookieWriteOptions {
  let secure = false;
  try {
    secure = new URL(request.url).protocol === "https:";
  } catch {
    secure = authCookieOptions(maxAge).secure === true;
  }
  if (process.env.COOKIE_SECURE === "true") secure = true;
  if (process.env.COOKIE_SECURE === "false") secure = false;
  if (process.env.VERCEL === "1") secure = true;
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge,
    ...overrides,
  };
}

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, accessToken, authCookieOptions(60 * 60 * 8));
  jar.set(REFRESH_COOKIE, refreshToken, authCookieOptions(60 * 60 * 24 * 30));
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export function applyAuthCookies(
  target: { cookies: { set: (name: string, value: string, options?: CookieWriteOptions) => void } },
  accessToken: string,
  refreshToken: string,
) {
  target.cookies.set(ACCESS_COOKIE, accessToken, authCookieOptions(60 * 60 * 8));
  target.cookies.set(REFRESH_COOKIE, refreshToken, authCookieOptions(60 * 60 * 24 * 30));
}

export function clearAuthCookiesOn(
  target: { cookies: { set: (name: string, value: string, options?: CookieWriteOptions) => void } },
) {
  const cleared = { ...authCookieOptions(0), maxAge: 0 };
  target.cookies.set(ACCESS_COOKIE, "", cleared);
  target.cookies.set(REFRESH_COOKIE, "", cleared);
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
