import Link from "next/link";
import { loginUser } from "@/app/actions";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="auth-shell">
      <div className="panel">
        <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Welcome back</h1>
        <p style={{ color: "var(--muted)" }}>Sign in to manage memorials and service requests.</p>
        <form className="form-stack" action={loginUser}>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required minLength={6} />
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
