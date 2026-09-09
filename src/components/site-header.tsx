import Link from "next/link";
import { apiV1, getAccessToken } from "@/lib/api-v1";
import { getPublicSiteConfig } from "@/lib/site-config";

export async function SiteHeader() {
  const config = await getPublicSiteConfig();
  let loggedIn = false;
  try {
    const token = await getAccessToken();
    if (token) {
      await apiV1("/api/v1/auth/me", { token });
      loggedIn = true;
    }
  } catch {
    loggedIn = false;
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
              <Link href="/api/auth/logout">Sign out</Link>
            </>
          ) : (
            <>
              <Link href="/sign-in">Sign in</Link>
              <Link href="/create" className="nav-cta">
                Create a Memorial
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
