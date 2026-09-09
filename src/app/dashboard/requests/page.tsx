import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createPlatformJwt, platformFetch } from "@/lib/platform";

type ServiceRequest = {
  id: number;
  title: string;
  status: string;
  category: string;
  notes?: string;
  obtainable?: string;
};

export const metadata = { title: "Service requests" };

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  let requests: ServiceRequest[] = [];
  try {
    const token = await createPlatformJwt({
      sub: session.user.id,
      email: session.user.email || "",
      role: session.user.role,
      name: session.user.name,
    });
    const res = await platformFetch("/api/requests/mine", { token });
    if (res.ok) requests = await res.json();
  } catch {
    /* API may be offline during Phase 1 */
  }

  return (
    <div className="dash-shell">
      <p>
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)" }}>Service requests</h1>
        <Link href="/dashboard/requests/new" className="btn btn-solid">
          New request
        </Link>
      </div>
      <div className="panel">
        {requests.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            No requests yet. Start one to share notes and what is obtainable with vendors.
          </p>
        ) : (
          requests.map((r) => (
            <div className="list-row" key={r.id}>
              <div>
                <strong>{r.title}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  {r.category} · {r.status}
                </div>
              </div>
              <span className="badge">{r.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
