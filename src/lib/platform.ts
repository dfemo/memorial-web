import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function secret() {
  return encoder.encode(
    process.env.PLATFORM_API_JWT_SECRET || process.env.AUTH_SECRET || "dev-secret",
  );
}

export async function createPlatformJwt(payload: {
  sub: string;
  email: string;
  role: string;
  name?: string | null;
}) {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret());
}

export async function verifyPlatformJwt(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload;
}

export async function platformFetch(
  path: string,
  options: RequestInit & { token?: string; revalidate?: number | false } = {},
) {
  const base = process.env.PLATFORM_API_URL || "http://localhost:8080";
  const { token, revalidate, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const next =
    revalidate === false
      ? undefined
      : { revalidate: typeof revalidate === "number" ? revalidate : 0 };

  return fetch(`${base}${path}`, {
    ...init,
    headers,
    ...(revalidate === false || revalidate === 0
      ? { cache: "no-store" as const }
      : next
        ? { next }
        : { cache: "no-store" as const }),
  });
}
