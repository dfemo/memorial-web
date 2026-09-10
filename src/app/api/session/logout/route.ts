import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, authCookieOptionsForRequest } from "@/lib/api-v1";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  const cleared = authCookieOptionsForRequest(request, 0);
  response.cookies.set(ACCESS_COOKIE, "", cleared);
  response.cookies.set(REFRESH_COOKIE, "", cleared);
  response.cookies.set("er_auth", "", { ...cleared, httpOnly: false });
  return response;
}
