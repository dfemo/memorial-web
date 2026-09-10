import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata = { title: "Sign up" };
export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/create";

  return (
    <div className="auth-shell">
      <div className="soft-card">
        <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Join EverRemember</h1>
        <p style={{ color: "var(--muted)" }}>
          Create an account to publish a memorial and invite family.
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
        <SignUpForm nextPath={next} />
      </div>
    </div>
  );
}
