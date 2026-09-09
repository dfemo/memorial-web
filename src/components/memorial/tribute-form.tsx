"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TributeForm({ memorialId, slug }: { memorialId: string; slug: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setError(null);
    const fd = new FormData(form);
    try {
      const res = await fetch(`/api/proxy/memorials/${memorialId}/tributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: String(fd.get("authorName") || ""),
          message: String(fd.get("message") || ""),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not post tribute");
      }
      form.reset();
      router.push(`/memorial/${slug}?tab=tributes`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <label>
        Your name
        <input name="authorName" required />
      </label>
      <label>
        Tribute
        <textarea name="message" required placeholder="Share a memory or condolence..." />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn btn-solid" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Leave a tribute"}
      </button>
    </form>
  );
}
