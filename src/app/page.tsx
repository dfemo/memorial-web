import Link from "next/link";
import { apiV1, type Memorial } from "@/lib/api-v1";
import { getPublicSiteConfig } from "@/lib/site-config";

export default async function HomePage() {
  const config = await getPublicSiteConfig();
  let featured: Memorial[] = [];
  try {
    featured = await apiV1<Memorial[]>("/api/v1/memorials/featured", { auth: false });
  } catch {
    featured = [];
  }

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>Keep Their Memory Alive, Forever.</h1>
          <p>
            Create a beautiful memorial where family and friends can share stories, photos and
            memories of the people who matter most.
          </p>
          <div className="cta-row">
            <Link href="/create" className="btn btn-primary">
              Create a Memorial
            </Link>
            <Link href="/browse" className="btn btn-ghost">
              Explore Memorials
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>How it works</h2>
          <p className="lede">Three gentle steps from remembrance to a lasting place online.</p>
          <div className="feature-grid">
            <div className="soft-card">
              <h3>1. Create</h3>
              <p>Share a name, dates, photos, and the story that made them unique.</p>
            </div>
            <div className="soft-card">
              <h3>2. Invite</h3>
              <p>Bring family and friends to add memories, tributes, and photographs.</p>
            </div>
            <div className="soft-card">
              <h3>3. Remember</h3>
              <p>Return on birthdays and anniversaries — a calm space that stays with you.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <h2>{config.sectionTitle}</h2>
          <p className="lede">{config.sectionLede}</p>
          <div className="feature-grid">
            <div className="soft-card">
              <h3>Life stories</h3>
              <p>Biography, service details, and the moments that shaped a life.</p>
            </div>
            <div className="soft-card">
              <h3>Photos & videos</h3>
              <p>Galleries that feel personal — not like a social feed.</p>
            </div>
            <div className="soft-card">
              <h3>Tributes</h3>
              <p>Messages and memories from everyone who loved them.</p>
            </div>
            <div className="soft-card">
              <h3>Privacy you control</h3>
              <p>Public, invite-only, or private — you decide who can visit.</p>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <h2>Featured memorials</h2>
            <p className="lede">A few public remembrances shared with care.</p>
            <div className="card-grid">
              {featured.map((m) => (
                <Link key={m.id} href={`/memorial/${m.slug}`} className="soft-card">
                  <h3>{m.displayName}</h3>
                  <p>{m.biography?.slice(0, 140) || "In loving memory."}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="soft-card">
            <h2 style={{ marginTop: 0 }}>Plans that grow with you</h2>
            <p className="lede">Start free. Upgrade for more media, privacy, and permanence.</p>
            <Link href="/pricing" className="btn btn-solid">
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
