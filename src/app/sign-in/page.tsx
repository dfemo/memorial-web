import Link from "next/link";

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/dashboard";

  return (
    <div className="auth-shell">
      <div className="soft-card">
        <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Welcome back</h1>
        <p style={{ color: "var(--muted)" }}>Sign in to create and manage memorials.</p>
        {sp.error && (
          <p
            role="alert"
            style={{
              background: "rgba(140, 40, 40, 0.08)",
              color: "#7a2e2e",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            {sp.error}
          </p>
        )}
        <form className="form-stack" action="/api/session/login" method="post">
          <input type="hidden" name="next" value={next} />
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input name="password" type="password" required minLength={8} autoComplete="current-password" />
          </label>
          <button className="btn btn-solid" type="submit">
            Sign in
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          New here? <Link href="/sign-up">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
