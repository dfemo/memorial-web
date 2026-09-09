import { cookies } from "next/headers";

const ACCESS = "er_access";
const REFRESH = "er_refresh";

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS)?.value;
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  jar.set(ACCESS, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });
  jar.set(REFRESH, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
}

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

function apiBase() {
  return process.env.PLATFORM_API_URL || "http://localhost:8080";
}

export async function apiV1<T>(
  path: string,
  init: RequestInit & { auth?: boolean; token?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = init.token ?? (init.auth === false ? undefined : await getAccessToken());
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
