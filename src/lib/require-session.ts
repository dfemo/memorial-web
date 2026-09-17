import { redirect } from "next/navigation";
import { getAccessToken, getRefreshToken } from "@/lib/api-v1";

/**
 * Ensures a usable access token for server pages/actions.
 * Prefers silent refresh over bouncing to sign-in.
 */
export async function requireAccessToken(nextPath: string): Promise<string> {
  const access = await getAccessToken();
  if (access) return access;

  const refresh = await getRefreshToken();
  if (refresh) {
    redirect(`/api/session/refresh?next=${encodeURIComponent(nextPath)}`);
  }
  redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
}

/** Soft variant: returns undefined when anonymous; refreshes when possible. */
export async function ensureAccessToken(nextPath?: string): Promise<string | undefined> {
  const access = await getAccessToken();
  if (access) return access;
  const refresh = await getRefreshToken();
  if (refresh && nextPath) {
    redirect(`/api/session/refresh?next=${encodeURIComponent(nextPath)}`);
  }
  return undefined;
}
