import Link from "next/link";
import { loginAction } from "@/app/ever-actions";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="auth-shell">
      <div className="soft-card">
        <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Welcome back</h1>
        <p style={{ color: "var(--muted)" }}>Sign in to create and manage memorials.</p>
        <form className="form-stack" action={loginAction}>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required minLength={8} />
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
