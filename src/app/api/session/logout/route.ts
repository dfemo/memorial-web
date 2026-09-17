import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/api-v1";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  clearSessionCookies(response, request);
  // Also expire common legacy names if any linger.
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Clear-Site-Data", "\"cookies\"");
  return response;
}
