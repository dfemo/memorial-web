import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, apiV1, type MemorialDetail } from "@/lib/api-v1";
import { TributeForm } from "@/components/memorial/tribute-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const detail = await apiV1<MemorialDetail>(
      `/api/v1/memorials/by-slug/${encodeURIComponent(slug)}`,
      {
        auth: false,
      },
    );
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
    detail = await apiV1<MemorialDetail>(`/api/v1/memorials/by-slug/${encodeURIComponent(slug)}`, {
      auth: false,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    const message =
      err instanceof Error
        ? err.message
        : "Could not load this memorial from the platform API.";
    return (
      <div className="narrow-shell">
        <div className="soft-card">
          <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Memorial unavailable</h1>
          <p style={{ color: "var(--muted)" }}>{message}</p>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Slug: <code>{slug}</code>. If you just published it, confirm{" "}
            <code>PLATFORM_API_URL</code> on Vercel points at your Railway API and that the API uses
            persistent Postgres (not ephemeral H2).
          </p>
          <div className="cta-row" style={{ marginTop: "1rem" }}>
            <Link href="/browse" className="btn btn-solid">
              Explore memorials
            </Link>
            <Link href="/dashboard" className="btn btn-ghost">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const m = detail.memorial;

  let publishedStory: string | null = null;
  let timeline: Array<{
    id: string;
    eventType: string;
    title: string;
    description?: string;
    eventDate?: string | null;
  }> = [];
  let legacyMemories: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
  }> = [];

  try {
    const story = await apiV1<{ narrative: string }>(
      `/api/v1/memorials/${m.id}/legacy-ai/story`,
      { auth: false },
    );
    publishedStory = story.narrative;
  } catch {
    publishedStory = null;
  }
  try {
    const tl = await apiV1<{ items: typeof timeline }>(
      `/api/v1/memorials/${m.id}/legacy-ai/timeline`,
      { auth: false },
    );
    timeline = tl.items || [];
  } catch {
    timeline = [];
  }
  try {
    legacyMemories = await apiV1<typeof legacyMemories>(
      `/api/v1/memorials/${m.id}/legacy-ai/memories`,
      { auth: false },
    );
  } catch {
    legacyMemories = [];
  }

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
    { id: "tell", label: "Tell Their Story" },
    { id: "timeline", label: "Timeline" },
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
            <Link href={`?tab=tell`} className="btn btn-ghost">
              Tell Their Story
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

        {(tab === "tell" || tab === "home") && publishedStory && (
          <section className="soft-card">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Tell Their Story</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Family-approved narrative created with Legacy AI from supplied memories only.
            </p>
            <p style={{ whiteSpace: "pre-wrap" }}>{publishedStory}</p>
          </section>
        )}

        {tab === "tell" && !publishedStory && (
          <section className="soft-card">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Tell Their Story</h2>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>
              An approved public narrative has not been published yet.
            </p>
          </section>
        )}

        {(tab === "timeline" || tab === "home") && timeline.length > 0 && (
          <section className="soft-card">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Life timeline</h2>
            <div style={{ display: "grid", gap: "0.9rem" }}>
              {timeline.map((item) => (
                <div key={item.id} style={{ borderLeft: "3px solid var(--accent-soft)", paddingLeft: "0.9rem" }}>
                  <span className="badge">{item.eventType}</span>
                  <h3 style={{ fontFamily: "var(--font-display)", margin: "0.35rem 0" }}>
                    {item.title}
                  </h3>
                  {item.eventDate && (
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      {formatDate(item.eventDate)}
                    </div>
                  )}
                  <p style={{ marginBottom: 0 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(tab === "memories" || tab === "home") && (
          <section className="soft-card">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Memories</h2>
            {legacyMemories.map((mem) => (
              <article key={mem.id} style={{ marginBottom: "1.1rem" }}>
                <span className="badge">{mem.category}</span>
                <h3 style={{ fontFamily: "var(--font-display)", margin: "0.35rem 0" }}>
                  {mem.title}
                </h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{mem.content}</p>
              </article>
            ))}
            {detail.stories.map((s) => (
              <article key={s.id} style={{ marginBottom: "1.1rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 0 }}>{s.title}</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{s.content}</p>
              </article>
            ))}
            {legacyMemories.length === 0 && detail.stories.length === 0 && (
              <p style={{ color: "var(--muted)" }}>No categorized memories yet.</p>
            )}
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

        {(tab === "tributes" || tab === "home") && (
          <section className="soft-card">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Tributes</h2>
            <TributeForm memorialId={m.id} slug={m.slug} />
            {detail.tributes.map((t) => (
              <div
                key={t.id}
                style={{ borderTop: "1px solid var(--line)", marginTop: "1rem", paddingTop: "1rem" }}
              >
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
