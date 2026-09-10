import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

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
        <SignInForm nextPath={next} />
      </div>
    </div>
  );
}
