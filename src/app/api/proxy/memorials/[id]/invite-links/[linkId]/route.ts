import { NextResponse } from "next/server";
import { apiBase, getAccessToken } from "@/lib/api-v1";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; linkId: string }> },
) {
  const { id, linkId } = await context.params;
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  try {
    const res = await fetch(
      `${apiBase()}/api/v1/memorials/${encodeURIComponent(id)}/invite-links/${encodeURIComponent(linkId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            (data as { error?: string }).error || `Could not revoke (${res.status})`,
        },
        { status: res.status },
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Cannot reach platform API." }, { status: 503 });
  }
}
