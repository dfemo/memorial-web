import Link from "next/link";
import { registerAction } from "@/app/ever-actions";

export const metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <div className="auth-shell">
      <div className="soft-card">
        <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Join EverRemember</h1>
        <p style={{ color: "var(--muted)" }}>
          Create an account to publish a memorial and invite family.
        </p>
        <form className="form-stack" action={registerAction}>
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
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required minLength={8} />
          </label>
          <button className="btn btn-solid" type="submit">
            Create account
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
