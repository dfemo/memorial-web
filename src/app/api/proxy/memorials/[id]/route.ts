import { NextResponse } from "next/server";
import { ApiError, apiBase, getAccessToken } from "@/lib/api-v1";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetch(`${apiBase()}/api/v1/memorials/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        (data as { error?: string; message?: string }).error ||
        (data as { message?: string }).message ||
        `Save failed (${res.status})`;
      return NextResponse.json({ error: message }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : `Cannot reach platform API at ${apiBase()}. Check PLATFORM_API_URL.`;
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
