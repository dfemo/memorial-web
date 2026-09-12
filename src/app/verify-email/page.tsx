import Link from "next/link";
import { apiBase } from "@/lib/api-v1";

export const metadata = { title: "Verify email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim();

  let ok = false;
  let message = "Missing verification token.";
  if (token) {
    try {
      const res = await fetch(
        `${apiBase()}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (res.ok && data.ok) {
        ok = true;
        message = "Your email is verified. You can now leave vendor ratings.";
      } else {
        message = data.error || "This verification link is invalid or expired.";
      }
    } catch {
      message = "Could not reach the verification service. Try again shortly.";
    }
  }

  return (
    <div className="auth-shell">
      <div className="soft-card">
        <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>
          {ok ? "Email verified" : "Email verification"}
        </h1>
        <p role={ok ? "status" : "alert"} style={{ color: ok ? "var(--accent)" : "#7a2e2e" }}>
          {message}
        </p>
        <div className="cta-row">
          <Link href="/vendors" className="btn btn-solid">
            Browse vendors
          </Link>
          <Link href="/dashboard" className="btn btn-outline">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
