import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiV1, type MemorialDetail } from "@/lib/api-v1";
import { TributeForm } from "@/components/memorial/tribute-form";

function formatDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await apiV1<MemorialDetail>(`/api/v1/memorials/by-slug/${slug}`, {
      auth: false,
    });
    const m = detail.memorial;
    const title = `In Loving Memory of ${m.displayName}`;
    return {
      title,
      description: m.biography?.slice(0, 155) || `A memorial for ${m.displayName} on EverRemember.`,
      openGraph: {
        title,
        description: m.biography?.slice(0, 155) || undefined,
        images: m.coverPhotoUrl || m.profilePhotoUrl || undefined,
      },
    };
  } catch {
    return { title: "Memorial" };
  }
}

export default async function PublicMemorialPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tab = sp.tab || "home";

  let detail: MemorialDetail;
  try {
    detail = await apiV1<MemorialDetail>(`/api/v1/memorials/by-slug/${slug}`, { auth: false });
  } catch {
    notFound();
  }

  const m = detail.memorial;
  const birth = formatDate(m.dateOfBirth);
  const death = formatDate(m.dateOfDeath);
  const cover =
    m.coverPhotoUrl ||
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&q=80";
  const profile =
    m.profilePhotoUrl ||
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80";

  const tabs = [
    { id: "home", label: "Home" },
    { id: "story", label: "Life Story" },
    { id: "memories", label: "Memories" },
    { id: "photos", label: "Photos" },
    { id: "tributes", label: "Tributes" },
    { id: "family", label: "Family & Friends" },
  ];

  return (
    <>
      <section className="memorial-hero" style={{ ["--cover" as string]: `url(${cover})` }}>
        <div className="memorial-hero-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="profile-orb" src={profile} alt={m.displayName} />
          <p className="eyebrow">In Loving Memory of</p>
          <h1>{m.displayName}</h1>
          {(birth || death) && (
            <p className="dates">{[birth, death].filter(Boolean).join(" — ")}</p>
          )}
          <div className="cta-row" style={{ justifyContent: "center", marginTop: "1.25rem" }}>
            <Link href={`?tab=tributes`} className="btn btn-primary">
              Leave a Tribute
            </Link>
            <Link href={`?tab=memories`} className="btn btn-ghost">
              Share a Memory
            </Link>
          </div>
        </div>
      </section>

      <div className="memorial-body">
        <nav className="tabs">
          {tabs.map((t) => (
            <Link key={t.id} href={`?tab=${t.id}`} className={tab === t.id ? "active" : ""}>
              {t.label}
            </Link>
          ))}
        </nav>

        {(tab === "home" || tab === "story") && (
          <section className="soft-card">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Life story</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {m.biography || "A life remembered with love."}
            </p>
            {m.serviceInfo && (
              <>
                <h3 style={{ fontFamily: "var(--font-display)" }}>Service details</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{m.serviceInfo}</p>
              </>
            )}
            {m.location && <p style={{ color: "var(--muted)" }}>{m.location}</p>}
          </section>
        )}

        {(tab === "home" || tab === "photos") && detail.photos.length > 0 && (
          <section className="soft-card">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Photos</h2>
            <div className="gallery">
              {detail.photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} src={p.thumbnailUrl || p.url} alt={p.caption || ""} />
              ))}
            </div>
          </section>
        )}

        {(tab === "memories" || tab === "home") && detail.stories.length > 0 && (
          <section className="soft-card">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Stories</h2>
            {detail.stories.map((s) => (
              <article key={s.id} style={{ marginBottom: "1.25rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 0 }}>{s.title}</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{s.content}</p>
              </article>
            ))}
          </section>
        )}

        {(tab === "tributes" || tab === "home") && (
          <section className="soft-card">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Tributes</h2>
            <TributeForm memorialId={m.id} slug={m.slug} />
            {detail.tributes.map((t) => (
              <div key={t.id} style={{ borderTop: "1px solid var(--line)", marginTop: "1rem", paddingTop: "1rem" }}>
                <strong>{t.authorName}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  {new Date(t.createdAt).toLocaleString()}
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{t.message}</p>
              </div>
            ))}
            {detail.tributes.length === 0 && (
              <p style={{ color: "var(--muted)" }}>Be the first to leave a tribute.</p>
            )}
          </section>
        )}

        {tab === "family" && (
          <section className="soft-card">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Family & friends</h2>
            {detail.contributors.map((c) => (
              <div className="list-row" key={c.id}>
                <span>Contributor</span>
                <span className="badge">{c.role}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
