"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({ nextPath = "/create" }: { nextPath?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const body = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/session/register", {
        method: "POST",
        body,
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) {
        setError(data.error || `Sign-up failed (${res.status})`);
        setPending(false);
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
      setPending(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <input type="hidden" name="next" value={nextPath} />
      {error && (
        <p
          role="alert"
          style={{
            background: "rgba(140, 40, 40, 0.08)",
            color: "#7a2e2e",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
          }}
        >
          {error}
        </p>
      )}
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
      <button className="btn btn-solid" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p style={{ marginTop: "0.5rem" }}>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
