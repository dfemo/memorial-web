"use client";

import Link from "next/link";

export default function ManageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="dash-shell">
      <div className="soft-card">
        <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Manage page error</h1>
        <p style={{ color: "var(--muted)" }}>
          {error.message || "Something went wrong while loading this memorial."}
        </p>
        <div className="cta-row">
          <button type="button" className="btn btn-solid" onClick={reset}>
            Try again
          </button>
          <Link href="/dashboard" className="btn btn-ghost">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
