import { NextResponse } from "next/server";
import { ApiError, apiV1 } from "@/lib/api-v1";

/** Debug / client helper: mirrors public by-slug lookup against PLATFORM_API_URL. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  try {
    const detail = await apiV1(`/api/v1/memorials/by-slug/${encodeURIComponent(slug)}`, {
      auth: false,
    });
    return NextResponse.json({ ok: true, detail });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 502;
    const message = err instanceof Error ? err.message : "Lookup failed";
    return NextResponse.json(
      {
        ok: false,
        slug,
        status,
        error: message,
        apiBase: process.env.PLATFORM_API_URL || "http://localhost:8080",
      },
      { status },
    );
  }
}
