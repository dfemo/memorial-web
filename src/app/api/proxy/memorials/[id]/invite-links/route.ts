import { NextResponse } from "next/server";
import { apiBase, getAccessToken } from "@/lib/api-v1";

async function authed(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            (data as { error?: string; message?: string }).error ||
            (data as { message?: string }).message ||
            `Request failed (${res.status})`,
        },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: `Cannot reach platform API at ${apiBase()}.` },
      { status: 503 },
    );
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return authed(`/api/v1/memorials/${encodeURIComponent(id)}/invite-links`);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  return authed(`/api/v1/memorials/${encodeURIComponent(id)}/invite-links`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
