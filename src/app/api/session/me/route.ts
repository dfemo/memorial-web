import { NextResponse } from "next/server";
import { ApiError, apiV1, getAccessToken, type ApiUser } from "@/lib/api-v1";

export async function GET() {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  try {
    const user = await apiV1<ApiUser>("/api/v1/auth/me", { token });
    return NextResponse.json({ authenticated: true, user });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 401;
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ authenticated: false, error: message }, { status });
  }
}
