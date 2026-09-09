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
  options: RequestInit & { token?: string } = {},
) {
  const base = process.env.PLATFORM_API_URL || "http://localhost:8080";
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  return res;
}
