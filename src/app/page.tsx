import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/plans";
import { getPublicSiteConfig } from "@/lib/site-config";

export default async function HomePage() {
  const config = await getPublicSiteConfig();

  let featured: Awaited<ReturnType<typeof prisma.memorial.findMany>> = [];
  if (config.showFeaturedMemorials) {
    try {
      featured = await prisma.memorial.findMany({
        where: { featured: true, privacy: "PUBLIC" },
        take: 3,
        orderBy: { updatedAt: "desc" },
      });
    } catch {
      // DB optional for marketing shell when only API config is available
    }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>{config.brandName}</h1>
          <p>{config.tagline}</p>
          <div className="cta-row">
            <Link href="/sign-up" className="btn btn-primary">
              {config.heroCtaPrimary}
            </Link>
            <Link href="/pricing" className="btn btn-ghost">
              {config.heroCtaSecondary}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>{config.sectionTitle}</h2>
          <p className="lede">{config.sectionLede}</p>
          <div className="feature-grid">
            <div className="feature-item">
              <h3>Memorial pages</h3>
              <p>Biography, galleries, service information, and themes that feel personal.</p>
            </div>
            <div className="feature-item">
              <h3>Guestbook tributes</h3>
              <p>Invite stories, condolences, and memories that grow over time.</p>
            </div>
            <div className="feature-item">
              <h3>Privacy controls</h3>
              <p>Public, unlisted, or private access so you decide who can visit.</p>
            </div>
            {config.showVendorDirectory && (
              <div className="feature-item">
                <h3>Vendor help</h3>
                <p>
                  Request florists, funeral homes, and celebrants with clear notes on what you need.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {config.showPartnerResources && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="panel" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>
                {config.partnerTitle}
              </h2>
              <p className="lede" style={{ marginBottom: "1rem" }}>
                {config.partnerBody}
              </p>
              <Link href={config.partnerCtaUrl} className="btn btn-solid">
                {config.partnerCtaLabel}
              </Link>
            </div>
          </div>
        </section>
      )}

      {config.showFeaturedMemorials && featured.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <h2>Featured memorials</h2>
            <p className="lede">A few public remembrances shared with the community.</p>
            <div className="feature-grid">
              {featured.map((m) => (
                <Link key={m.id} href={`/memorials/${m.slug}`} className="price-panel">
                  <h3>{displayName(m.firstName, m.lastName)}</h3>
                  <p>{m.biography?.slice(0, 120) || "A life remembered."}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {config.showVendorDirectory && config.vendors.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <h2>{config.vendorsTitle}</h2>
            <p className="lede">{config.vendorsLede}</p>
            <div className="pricing-grid">
              {config.vendors.slice(0, 3).map((v) => (
                <Link key={v.id} href="/vendors" className="price-panel">
                  <span className="badge">{v.category}</span>
                  <h3 style={{ marginTop: "0.6rem" }}>{v.businessName}</h3>
                  <p>{v.description || "Professional funeral services."}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
