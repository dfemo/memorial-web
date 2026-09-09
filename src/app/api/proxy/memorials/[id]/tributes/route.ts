import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/api-v1";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  const token = await getAccessToken();
  const base = process.env.PLATFORM_API_URL || "http://localhost:8080";
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}/api/v1/memorials/${id}/tributes`, {
    method: "POST",
    headers,
    body,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
