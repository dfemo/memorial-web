import Link from "next/link";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  ACTIVITY_COOKIE,
  REFRESH_COOKIE,
  SESSION_IDLE_MS,
  apiV1,
  getAccessToken,
} from "@/lib/api-v1";
import { getPublicSiteConfig } from "@/lib/site-config";

export async function SiteHeader() {
  const config = await getPublicSiteConfig();
  const jar = await cookies();
  const activity = Number(jar.get(ACTIVITY_COOKIE)?.value || 0);
  const idleExpired = activity > 0 && Date.now() - activity > SESSION_IDLE_MS;
  let loggedIn =
    !idleExpired &&
    Boolean(jar.get(ACCESS_COOKIE)?.value || jar.get(REFRESH_COOKIE)?.value);

  if (loggedIn) {
    try {
      const token = await getAccessToken();
      if (token) await apiV1("/api/v1/auth/me", { token });
    } catch {
      // Keep nav if cookies still present; middleware/refresh will recover.
    }
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand-mark">
          EverRemember
        </Link>
        <nav className="site-nav">
          <Link href="/browse">Explore</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          {config.showVendorDirectory && <Link href="/vendors">Vendors</Link>}
          {loggedIn ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/create" className="nav-cta">
                Create a Memorial
              </Link>
              <Link href="/api/session/logout">Sign out</Link>
            </>
          ) : (
            <>
              <Link href="/sign-in">Sign in</Link>
              <Link href="/sign-in?next=/create" className="nav-cta">
                Create a Memorial
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
