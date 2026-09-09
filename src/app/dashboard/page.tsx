import Link from "next/link";
import { redirect } from "next/navigation";
import { apiV1, getAccessToken, type Memorial } from "@/lib/api-v1";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in");

  let memorials: Memorial[] = [];
  try {
    memorials = await apiV1<Memorial[]>("/api/v1/memorials/mine");
  } catch {
    redirect("/sign-in");
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

      <div className="soft-card" style={{ marginTop: "1.25rem" }}>
        {memorials.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            No memorials yet. Start with a name, a photo, and a few words of love.
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
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link href={`/memorial/${m.slug}`} className="btn btn-outline">
                  View
                </Link>
                <Link href={`/memorial/manage/${m.id}`} className="btn btn-solid">
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
