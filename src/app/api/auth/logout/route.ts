import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/api-v1";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  clearSessionCookies(response, request);
  return response;
}
