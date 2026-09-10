import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/api-v1";

type Ctx = { params: Promise<{ memorialId: string; path?: string[] }> };

async function forward(request: Request, memorialId: string, path: string[] = []) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const suffix = path.length ? `/${path.join("/")}` : "";
  const base = process.env.PLATFORM_API_URL || "http://localhost:8080";
  const url = `${base}/api/v1/memorials/${memorialId}/legacy-ai${suffix}`;
  const init: RequestInit = {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }
  const res = await fetch(url, init);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(request: Request, ctx: Ctx) {
  const { memorialId, path } = await ctx.params;
  return forward(request, memorialId, path);
}

export async function POST(request: Request, ctx: Ctx) {
  const { memorialId, path } = await ctx.params;
  return forward(request, memorialId, path);
}
