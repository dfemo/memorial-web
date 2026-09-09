import Link from "next/link";
import { getPublicSiteConfig } from "@/lib/site-config";

export async function SiteFooter() {
  const config = await getPublicSiteConfig();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner wrap">
        <p className="footer-brand">EverRemember</p>
        <p className="footer-note">{config.footerNote}</p>
        <div className="footer-links">
          <Link href="/browse">Explore</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/create">Create a Memorial</Link>
        </div>
      </div>
    </footer>
  );
}
