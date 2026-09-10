import Link from "next/link";
import { redirect } from "next/navigation";
import { ApiError, apiV1, getAccessToken, getRefreshToken, type Memorial } from "@/lib/api-v1";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const token = await getAccessToken();
  const refresh = await getRefreshToken();

  if (!token && refresh) {
    redirect(`/api/session/refresh?next=${encodeURIComponent("/dashboard")}`);
  }
  if (!token) redirect("/sign-in?next=/dashboard");

  let memorials: Memorial[] = [];
  let loadError: string | null = null;

  try {
    memorials = await apiV1<Memorial[]>("/api/v1/memorials/mine");
  } catch (err) {
    // Spring often returns 403 for unauthenticated/expired JWT — treat like 401.
    if (err instanceof ApiError && (err.status === 401 || err.status === 403) && refresh) {
      redirect(`/api/session/refresh?next=${encodeURIComponent("/dashboard")}`);
    }
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect(
        "/sign-in?next=/dashboard&error=" +
          encodeURIComponent("Session expired. Please sign in again."),
      );
    }
    loadError = err instanceof Error ? err.message : "Could not load memorials.";
  }

  return (
    <div className="dash-shell">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", marginBottom: 0 }}>My memorials</h1>
          <p style={{ color: "var(--muted)" }}>Create, publish, and care for remembrances.</p>
        </div>
        <Link href="/create" className="btn btn-solid">
          Create a Memorial
        </Link>
      </div>

      {loadError && (
        <p role="alert" className="soft-card" style={{ marginTop: "1.25rem", color: "#7a2e2e" }}>
          {loadError}
        </p>
      )}

      <div className="soft-card" style={{ marginTop: "1.25rem" }}>
        {!loadError && memorials.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            No memorials yet. Start with a name, a photo, and a few words of love.{" "}
            <Link href="/create">Create a memorial</Link>.
          </p>
        ) : (
          memorials.map((m) => (
            <div className="list-row" key={m.id}>
              <div>
                <strong>{m.displayName}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  /{m.slug} · <span className="badge">{m.published ? "Published" : "Draft"}</span>{" "}
                  <span className="badge">{m.privacyLevel}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Link href={`/memorial/${m.slug}`} className="btn btn-outline">
                  View
                </Link>
                {m.privacyLevel === "INVITE_ONLY" && (
                  <Link
                    href={`/memorial/manage/${m.id}#invite-links`}
                    className="btn btn-solid"
                  >
                    Generate invite link
                  </Link>
                )}
                <Link
                  href={`/memorial/manage/${m.id}`}
                  className={m.privacyLevel === "INVITE_ONLY" ? "btn btn-outline" : "btn btn-solid"}
                >
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
