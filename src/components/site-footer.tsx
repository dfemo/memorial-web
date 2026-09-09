import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="footer-brand">Let Us Handle Your Funeral</p>
        <p className="footer-note">
          Online memorials and funeral service coordination — with care, clarity, and lasting remembrance.
        </p>
        <div className="footer-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/vendors">Find vendors</Link>
          <Link href="/sign-up">Create a memorial</Link>
        </div>
      </div>
    </footer>
  );
}
