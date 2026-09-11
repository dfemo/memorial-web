import Link from "next/link";

export const metadata = { title: "Sign up" };
export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; as?: string }>;
}) {
  const sp = await searchParams;
  const asVendor = sp.as === "vendor";
  const next =
    sp.next && sp.next.startsWith("/")
      ? sp.next
      : asVendor
        ? "/dashboard/vendor"
        : "/create";
  const accountType = asVendor ? "VENDOR" : "OWNER";

  return (
    <div className="auth-shell">
      <div className="soft-card">
        <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Join EverRemember</h1>
        <p style={{ color: "var(--muted)" }}>
          Choose how you&apos;ll use EverRemember — as a memorial owner or as a vendor.
        </p>
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
        <form className="form-stack" action="/api/session/register" method="post">
          <input type="hidden" name="next" value={next} />
          <fieldset className="account-type-field">
            <legend>I am signing up as</legend>
            <div className="account-type-grid">
              <label className="account-type-option">
                <input
                  type="radio"
                  name="accountType"
                  value="OWNER"
                  defaultChecked={accountType === "OWNER"}
                  required
                />
                <span>
                  <strong>Memorial owner</strong>
                  <small>Create and manage memorials for family</small>
                </span>
              </label>
              <label className="account-type-option">
                <input
                  type="radio"
                  name="accountType"
                  value="VENDOR"
                  defaultChecked={accountType === "VENDOR"}
                  required
                />
                <span>
                  <strong>Vendor</strong>
                  <small>List your business and manage your portfolio</small>
                </span>
              </label>
            </div>
          </fieldset>
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
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button className="btn btn-solid" type="submit">
            Create account
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          Already have an account?{" "}
          <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
