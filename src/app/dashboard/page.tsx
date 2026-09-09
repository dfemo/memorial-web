import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/plans";
import { createMemorial } from "@/app/actions";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const memorials = await prisma.memorial.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="dash-shell">
      <h1 style={{ fontFamily: "var(--font-display)", marginBottom: "0.4rem" }}>
        Your memorials
      </h1>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        Welcome{session.user.name ? `, ${session.user.name}` : ""}. Create a page, invite
        collaborators, or request vendor help.
      </p>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Create memorial</h2>
        <form className="form-stack" action={createMemorial}>
          <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
            <label>
              First name
              <input name="firstName" required />
            </label>
            <label>
              Last name
              <input name="lastName" required />
            </label>
          </div>
          <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Birth date
              <input name="birthDate" type="date" />
            </label>
            <label>
              Passing date
              <input name="deathDate" type="date" />
            </label>
          </div>
          <label>
            Biography
            <textarea name="biography" placeholder="Share their story..." />
          </label>
          <button className="btn btn-solid" type="submit">
            Create memorial
          </button>
        </form>
      </div>

      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>All memorials</h2>
          <Link href="/dashboard/requests" className="btn btn-outline">
            Service requests
          </Link>
        </div>
        {memorials.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No memorials yet.</p>
        ) : (
          memorials.map((m) => (
            <div className="list-row" key={m.id}>
              <div>
                <strong>{displayName(m.firstName, m.lastName)}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  /{m.slug} · <span className="badge">{m.plan}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link href={`/memorials/${m.slug}`} className="btn btn-outline">
                  View
                </Link>
                <Link href={`/dashboard/memorials/${m.id}`} className="btn btn-solid">
                  Manage
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
