import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { addTribute } from "@/app/actions";
import { auth } from "@/auth";
import { displayName } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

function formatDate(d: Date | null) {
  if (!d) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PublicMemorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const memorial = await prisma.memorial.findUnique({
    where: { slug },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      tributes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!memorial) notFound();

  const session = await auth();
  const isMember =
    session?.user?.id &&
    (memorial.ownerId === session.user.id ||
      (await prisma.memorialMember.findUnique({
        where: {
          memorialId_userId: {
            memorialId: memorial.id,
            userId: session.user.id,
          },
        },
      })));

  if (memorial.privacy === "PRIVATE" && !isMember) {
    const jar = await cookies();
    const unlocked = jar.get(`memorial_access_${memorial.id}`)?.value === "1";
    if (!unlocked) {
      return (
        <div className="auth-shell">
          <div className="panel">
            <h1 style={{ fontFamily: "var(--font-display)" }}>Private memorial</h1>
            <p style={{ color: "var(--muted)" }}>
              Enter the access password or sign in as a collaborator.
            </p>
            <form className="form-stack" action={`/api/memorials/${memorial.slug}/unlock`} method="post">
              <label>
                Password
                <input name="password" type="password" required />
              </label>
              <button className="btn btn-solid" type="submit">
                Unlock
              </button>
            </form>
          </div>
        </div>
      );
    }
  }

  const birth = formatDate(memorial.birthDate);
  const death = formatDate(memorial.deathDate);
  const cover =
    memorial.coverImageUrl ||
    memorial.media.find((m) => m.type === "COVER" || m.type === "PHOTO")?.url ||
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&q=80";

  const photos = memorial.media.filter((m) => m.type === "PHOTO");

  return (
    <>
      <section
        className="memorial-hero"
        style={{ ["--cover" as string]: `url(${cover})` }}
      >
        <div className="memorial-hero-inner">
          <h1>{displayName(memorial.firstName, memorial.lastName)}</h1>
          {(birth || death) && (
            <p className="dates">
              {[birth, death].filter(Boolean).join(" — ")}
            </p>
          )}
        </div>
      </section>

      <div className="memorial-body">
        {memorial.biography && (
          <section className="memorial-panel">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Life story</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{memorial.biography}</p>
          </section>
        )}

        {memorial.serviceInfo && (
          <section className="memorial-panel">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Service details</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{memorial.serviceInfo}</p>
          </section>
        )}

        {photos.length > 0 && (
          <section className="memorial-panel">
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Gallery</h2>
            <div className="gallery">
              {photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} src={p.url} alt={p.caption || ""} />
              ))}
            </div>
          </section>
        )}

        <section className="memorial-panel">
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Guestbook</h2>
          <form className="form-stack" action={addTribute.bind(null, slug)}>
            {!session?.user && (
              <label>
                Your name
                <input name="authorName" required />
              </label>
            )}
            <label>
              Tribute
              <textarea name="body" required placeholder="Share a memory or condolence..." />
            </label>
            <button className="btn btn-solid" type="submit">
              Leave a tribute
            </button>
          </form>
          {memorial.tributes.map((t) => (
            <div className="tribute" key={t.id}>
              <strong>{t.authorName}</strong>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                {t.createdAt.toLocaleString()}
              </div>
              <p style={{ whiteSpace: "pre-wrap" }}>{t.body}</p>
            </div>
          ))}
          {memorial.tributes.length === 0 && (
            <p style={{ color: "var(--muted)" }}>Be the first to leave a tribute.</p>
          )}
        </section>
      </div>
    </>
  );
}
