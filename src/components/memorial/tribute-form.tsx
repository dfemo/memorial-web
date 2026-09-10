"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TributeForm({ memorialId, slug }: { memorialId: string; slug: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [relationship, setRelationship] = useState("");
  const [assist, setAssist] = useState<{
    sourceNotes: string;
    suggestedWording: string;
    disclaimer: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/memorials/${memorialId}/tributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          message,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not post tribute");
      }
      setAuthorName("");
      setMessage("");
      setAssist(null);
      router.push(`/memorial/${slug}?tab=tributes`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  async function suggestWording() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/legacy-ai/${memorialId}/tribute-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: authorName || "Guest",
          userNotes: message,
          relationshipHint: relationship || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not generate suggestion");
      setAssist({
        sourceNotes: body.sourceNotes || message,
        suggestedWording: body.suggestedWording || "",
        disclaimer: body.disclaimer || "",
      });
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
        <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} required />
      </label>
      <label>
        Your relationship (optional)
        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="friend, niece, colleague…"
        />
      </label>
      <label>
        Your notes (required for AI assist)
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          placeholder="Share a memory or condolence in your own words..."
        />
      </label>
      <button
        className="btn btn-outline"
        type="button"
        onClick={suggestWording}
        disabled={pending || !message.trim()}
      >
        Legacy AI: suggest wording
      </button>
      {assist && (
        <div className="soft-card" style={{ boxShadow: "none" }}>
          <p style={{ marginTop: 0 }}>
            <span className="badge">Your notes</span>
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>{assist.sourceNotes}</p>
          <p>
            <span className="badge">Suggested wording</span>
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>{assist.suggestedWording}</p>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{assist.disclaimer}</p>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => setMessage(assist.suggestedWording)}
          >
            Use suggested wording
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <button className="btn btn-solid" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Leave a tribute"}
      </button>
    </form>
  );
}
