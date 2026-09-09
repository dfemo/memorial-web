import Link from "next/link";
import { auth } from "@/auth";

export async function SiteHeader() {
  let session: Awaited<ReturnType<typeof auth>> = null;
  try {
    session = await auth();
  } catch {
    // Missing AUTH_SECRET / host trust in production must not blank the whole site
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand-mark">
          Let Us Handle Your Funeral
        </Link>
        <nav className="site-nav">
          <Link href="/pricing">Pricing</Link>
          <Link href="/vendors">Vendors</Link>
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
