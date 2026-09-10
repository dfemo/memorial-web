"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignInForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = e.currentTarget;
    const body = new FormData(form);
    try {
      const res = await fetch("/api/session/login", {
        method: "POST",
        body,
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) {
        setError(data.error || `Sign-in failed (${res.status})`);
        setPending(false);
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
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
          autoComplete="current-password"
        />
      </label>
      <button className="btn btn-solid" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p style={{ marginTop: "0.5rem" }}>
        New here? <Link href="/sign-up">Create an account</Link>
      </p>
    </form>
  );
}
