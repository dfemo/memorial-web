import { NextResponse } from "next/server";
import { clearAuthCookiesOn } from "@/lib/api-v1";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  clearAuthCookiesOn(response);
  return response;
}
