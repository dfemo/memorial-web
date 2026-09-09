import Link from "next/link";
import { apiV1, type Memorial } from "@/lib/api-v1";

export const metadata = { title: "Explore memorials" };

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  let items: Memorial[] = [];
  let total = 0;
  try {
    const page = await apiV1<{
      items: Memorial[];
      total: number;
    }>(`/api/v1/memorials/search?q=${encodeURIComponent(q)}&page=0&size=24`, { auth: false });
    items = page.items;
    total = page.total;
  } catch {
    items = [];
  }

  return (
    <section className="section">
      <div className="wrap">
        <h2>Explore memorials</h2>
        <p className="lede">Search public remembrances by name.</p>
        <form className="form-stack" style={{ maxWidth: 480, marginBottom: "1.5rem" }}>
          <label>
            Search
            <input name="q" defaultValue={q} placeholder="First name, last name, or slug" />
          </label>
          <button className="btn btn-solid" type="submit">
            Search
          </button>
        </form>
        <p style={{ color: "var(--muted)" }}>{total} memorial{total === 1 ? "" : "s"}</p>
        <div className="card-grid">
          {items.map((m) => (
            <Link key={m.id} href={`/memorial/${m.slug}`} className="soft-card">
              <h3>{m.displayName}</h3>
              <p>{m.biography?.slice(0, 120) || "In loving memory."}</p>
            </Link>
          ))}
        </div>
        {items.length === 0 && (
          <div className="soft-card">
            <p style={{ margin: 0, color: "var(--muted)" }}>
              No public memorials yet.{" "}
              <Link href="/create">Create the first one</Link>.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
