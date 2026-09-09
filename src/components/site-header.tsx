import Link from "next/link";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getPublicSiteConfig } from "@/lib/site-config";

export async function SiteHeader() {
  let session: Session | null = null;
  try {
    session = await auth();
  } catch {
    // Missing AUTH_SECRET / host trust in production must not blank the whole site
  }

  const config = await getPublicSiteConfig();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand-mark">
          {config.brandName}
        </Link>
        <nav className="site-nav">
          <Link href="/pricing">Pricing</Link>
          {config.showVendorDirectory && <Link href="/vendors">Vendors</Link>}
          {session?.user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/api/auth/signout">Sign out</Link>
            </>
          ) : (
            <>
              <Link href="/sign-in">Sign in</Link>
              <Link href="/sign-up" className="nav-cta">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
