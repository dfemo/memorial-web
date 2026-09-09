import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/plans";

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof prisma.memorial.findMany>> = [];
  try {
    featured = await prisma.memorial.findMany({
      where: { featured: true, privacy: "PUBLIC" },
      take: 3,
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    // Production without a reachable DATABASE_URL (e.g. SQLite on serverless) should still render
  }

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>Let Us Handle Your Funeral</h1>
          <p>
            A lasting online memorial for the people you love — and a calm place to
            arrange the services that help families through goodbye.
          </p>
          <div className="cta-row">
            <Link href="/sign-up" className="btn btn-primary">
              Create a memorial
            </Link>
            <Link href="/pricing" className="btn btn-ghost">
              View plans
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Remember together</h2>
          <p className="lede">
            Share a life story, gather tributes, and keep photos and service details in
            one respectful place friends and family can visit from anywhere.
          </p>
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
            <div className="feature-item">
              <h3>Vendor help</h3>
              <p>Request florists, funeral homes, and celebrants with clear notes on what you need.</p>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
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
    </>
  );
}
