import Link from "next/link";
import { registerUser } from "@/app/actions";

export const metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <div className="auth-shell">
      <div className="panel">
        <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Create your account</h1>
        <p style={{ color: "var(--muted)" }}>
          Start a memorial in minutes. You can invite family collaborators later.
        </p>
        <form className="form-stack" action={registerUser}>
          <label>
            Full name
            <input name="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required minLength={6} />
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
