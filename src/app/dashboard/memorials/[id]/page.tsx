import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  addMedia,
  inviteCollaborator,
  startCheckout,
  updateMemorial,
} from "@/app/actions";
import { auth } from "@/auth";
import { THEMES, displayName, PLAN_LIMITS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export default async function ManageMemorialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;
  const sp = await searchParams;

  const memorial = await prisma.memorial.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      invites: { orderBy: { createdAt: "desc" } },
      members: { include: { user: true } },
    },
  });
  if (!memorial) notFound();

  const limits = PLAN_LIMITS[memorial.plan];
  const isOwner = memorial.ownerId === session.user.id;

  async function upgrade(planKey: "PREMIUM_MONTHLY" | "PREMIUM_YEARLY" | "LIFETIME") {
    "use server";
    await startCheckout(id, planKey);
  }

  return (
    <div className="dash-shell">
      <p>
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      <h1 style={{ fontFamily: "var(--font-display)" }}>
        {displayName(memorial.firstName, memorial.lastName)}
      </h1>
      <p style={{ color: "var(--muted)" }}>
        Plan <span className="badge">{memorial.plan}</span> · Photos up to {limits.photos}
        {sp.upgraded ? " · Upgraded" : ""}
      </p>

      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Details</h2>
        <form className="form-stack" action={updateMemorial.bind(null, memorial.id)}>
          <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
            <label>
              First name
              <input name="firstName" defaultValue={memorial.firstName} required />
            </label>
            <label>
              Last name
              <input name="lastName" defaultValue={memorial.lastName} required />
            </label>
          </div>
          <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Birth date
              <input
                name="birthDate"
                type="date"
                defaultValue={memorial.birthDate?.toISOString().slice(0, 10)}
              />
            </label>
            <label>
              Passing date
              <input
                name="deathDate"
                type="date"
                defaultValue={memorial.deathDate?.toISOString().slice(0, 10)}
              />
            </label>
          </div>
          <label>
            Biography
            <textarea name="biography" defaultValue={memorial.biography || ""} />
          </label>
          <label>
            Service information
            <textarea name="serviceInfo" defaultValue={memorial.serviceInfo || ""} />
          </label>
          <label>
            Cover image URL
            <input name="coverImageUrl" defaultValue={memorial.coverImageUrl || ""} />
          </label>
          <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Theme
              <select name="theme" defaultValue={memorial.theme}>
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Privacy
              <select name="privacy" defaultValue={memorial.privacy}>
                <option value="PUBLIC">Public</option>
                <option value="UNLISTED">Unlisted link</option>
                <option value="PRIVATE" disabled={!limits.privatePrivacy}>
                  Private {limits.privatePrivacy ? "" : "(Premium+)"}
                </option>
              </select>
            </label>
          </div>
          <label>
            Access password (optional for private)
            <input name="accessPassword" defaultValue={memorial.accessPassword || ""} />
          </label>
          <button className="btn btn-solid" type="submit">
            Save changes
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          Public page:{" "}
          <Link href={`/memorials/${memorial.slug}`}>/memorials/{memorial.slug}</Link>
        </p>
      </div>

      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Media</h2>
        <form className="form-stack" action={addMedia.bind(null, memorial.id)}>
          <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr 1fr" }}>
            <label>
              Type
              <select name="type" defaultValue="PHOTO">
                <option value="PHOTO">Photo</option>
                <option value="VIDEO">Video</option>
                <option value="MUSIC">Music</option>
                <option value="COVER">Cover</option>
              </select>
            </label>
            <label style={{ gridColumn: "span 2" }}>
              Media URL
              <input name="url" placeholder="https://..." required />
            </label>
          </div>
          <label>
            Caption
            <input name="caption" />
          </label>
          <button className="btn btn-outline" type="submit">
            Add media
          </button>
        </form>
        <div className="gallery" style={{ marginTop: "1rem" }}>
          {memorial.media
            .filter((m) => m.type === "PHOTO" || m.type === "COVER")
            .map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.id} src={m.url} alt={m.caption || ""} />
            ))}
        </div>
      </div>

      {isOwner && (
        <>
          <div className="panel" style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Upgrade plan</h2>
            <p style={{ color: "var(--muted)" }}>
              Without Stripe keys configured, upgrades apply instantly for local development.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              <form action={upgrade.bind(null, "PREMIUM_MONTHLY")}>
                <button className="btn btn-solid" type="submit">
                  Premium monthly
                </button>
              </form>
              <form action={upgrade.bind(null, "PREMIUM_YEARLY")}>
                <button className="btn btn-outline" type="submit">
                  Premium yearly
                </button>
              </form>
              <form action={upgrade.bind(null, "LIFETIME")}>
                <button className="btn btn-outline" type="submit">
                  Lifetime
                </button>
              </form>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Collaborators</h2>
            <form className="form-stack" action={inviteCollaborator.bind(null, memorial.id)}>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Role
                <select name="role" defaultValue="EDITOR">
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </label>
              <button className="btn btn-outline" type="submit">
                Invite
              </button>
            </form>
            {memorial.members.map((m) => (
              <div className="list-row" key={m.id}>
                <span>{m.user.email}</span>
                <span className="badge">{m.role}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="panel">
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Need services?</h2>
        <p style={{ color: "var(--muted)" }}>
          Share notes and what you need from florists, funeral homes, and more.
        </p>
        <Link
          href={`/dashboard/requests/new?memorialId=${memorial.id}`}
          className="btn btn-solid"
        >
          Request a vendor
        </Link>
      </div>
    </div>
  );
}
