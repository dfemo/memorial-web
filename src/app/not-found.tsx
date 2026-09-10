import Link from "next/link";

export default function NotFound() {
  return (
    <div className="narrow-shell">
      <div className="soft-card">
        <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Memorial not found</h1>
        <p style={{ color: "var(--muted)" }}>
          This public link does not match a published memorial on the connected platform API. It may
          have been removed, set to private, or created against a different database.
        </p>
        <div className="cta-row" style={{ marginTop: "1rem" }}>
          <Link href="/browse" className="btn btn-solid">
            Explore memorials
          </Link>
          <Link href="/create" className="btn btn-ghost">
            Create a memorial
          </Link>
        </div>
      </div>
    </div>
  );
}
