import Link from "next/link";
import { getPublicSiteConfig } from "@/lib/site-config";

export async function SiteFooter() {
  const config = await getPublicSiteConfig();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="footer-brand">{config.brandName}</p>
        <p className="footer-note">{config.footerNote}</p>
        <div className="footer-links">
          <Link href="/pricing">Pricing</Link>
          {config.showVendorDirectory && <Link href="/vendors">Find vendors</Link>}
          <Link href="/sign-up">Create a memorial</Link>
        </div>
      </div>
    </footer>
  );
}
