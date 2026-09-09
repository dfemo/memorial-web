import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/api-v1";

export async function GET(request: Request) {
  await clearAuthCookies();
  return NextResponse.redirect(new URL("/", request.url));
}
