"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MEMORY_CATEGORIES = [
  "CHILDHOOD",
  "FAMILY",
  "CAREER",
  "MARRIAGE",
  "TRAVEL",
  "CHURCH_FAITH",
  "FRIENDS",
  "ACHIEVEMENTS",
  "FUNNY_MOMENTS",
  "LEGACY",
] as const;

type Draft = {
  id: string;
  status: string;
  sourceNotes: Record<string, string>;
  generatedSections: Record<string, string>;
  approvedNarrative?: string | null;
  provenanceNotes?: string[];
};

type Memory = {
  id: string;
  title: string;
  content: string;
  category: string;
};

type TimelineItem = {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  eventDate?: string | null;
};

export function LegacyAiPanel({ memorialId }: { memorialId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [narrative, setNarrative] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  async function api(path: string, init?: RequestInit) {
    const res = await fetch(`/api/proxy/legacy-ai/${memorialId}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
  }

  async function generateBiography(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setPending(true);
    setError(null);
    try {
      const body = Object.fromEntries(
        [
          "childhood",
          "family",
          "education",
          "career",
          "faith",
          "achievements",
          "favouriteSayings",
          "importantEvents",
          "personalStories",
          "characterNotes",
        ].map((k) => [k, String(fd.get(k) || "") || null]),
      );
      const result = (await api("/biography", {
        method: "POST",
        body: JSON.stringify(body),
      })) as Draft;
      setDraft(result);
      setNarrative(result.approvedNarrative || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  async function approveDraft() {
    if (!draft) return;
    setPending(true);
    setError(null);
    try {
      const result = (await api(`/biography/${draft.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ reviewedNarrative: narrative }),
      })) as Draft;
      setDraft(result);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  async function publishDraft() {
    if (!draft) return;
    setPending(true);
    setError(null);
    try {
      const result = (await api(`/biography/${draft.id}/publish`, {
        method: "POST",
        body: "{}",
      })) as Draft;
      setDraft(result);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  async function addMemory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setPending(true);
    setError(null);
    try {
      const memory = (await api("/memories", {
        method: "POST",
        body: JSON.stringify({
          title: String(fd.get("title") || ""),
          content: String(fd.get("content") || ""),
          category: String(fd.get("category") || "LEGACY"),
        }),
      })) as Memory;
      setMemories((prev) => [memory, ...prev]);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  async function buildTimeline() {
    setPending(true);
    setError(null);
    try {
      const result = (await api("/timeline", {
        method: "POST",
        body: "{}",
      })) as { items: TimelineItem[] };
      setTimeline(result.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="soft-card" style={{ marginTop: "1.25rem" }}>
      <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Legacy AI</h2>
      <p style={{ color: "var(--muted)" }}>
        Preserve personality and stories with reviewable drafts. AI only uses notes you supply —
        never invents personal facts. Publish only after you approve.
      </p>
      {error && <p className="error">{error}</p>}

      <h3 style={{ fontFamily: "var(--font-display)" }}>1. Life Story Assistant</h3>
      <form className="form-stack" onSubmit={generateBiography}>
        {(
          [
            ["childhood", "Childhood memories"],
            ["family", "Family information"],
            ["education", "Education"],
            ["career", "Career"],
            ["faith", "Faith"],
            ["achievements", "Achievements"],
            ["favouriteSayings", "Favourite sayings"],
            ["importantEvents", "Important events"],
            ["personalStories", "Personal stories"],
            ["characterNotes", "Character notes"],
          ] as const
        ).map(([name, label]) => (
          <label key={name}>
            {label}
            <textarea name={name} placeholder="Only facts you want included…" />
          </label>
        ))}
        <button className="btn btn-solid" type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate biography draft"}
        </button>
      </form>

      {draft && (
        <div style={{ marginTop: "1.25rem" }}>
          <p>
            <span className="badge">{draft.status}</span>{" "}
            <span className="badge">provider draft</span>
          </p>
          <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
            {Object.entries(draft.generatedSections || {}).map(([section, text]) => (
              <div key={section} style={{ borderTop: "1px solid var(--line)", paddingTop: "0.75rem" }}>
                <strong>{section}</strong>
                <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{text}</p>
              </div>
            ))}
          </div>
          <label style={{ marginTop: "1rem" }}>
            Review narrative (edit before approve)
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              style={{ minHeight: 180 }}
            />
          </label>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
            <button className="btn btn-outline" type="button" onClick={approveDraft} disabled={pending}>
              Approve
            </button>
            <button className="btn btn-solid" type="button" onClick={publishDraft} disabled={pending}>
              Publish “Tell Their Story”
            </button>
          </div>
          {draft.provenanceNotes?.length ? (
            <ul style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              {draft.provenanceNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <h3 style={{ fontFamily: "var(--font-display)", marginTop: "2rem" }}>2. Memory Organizer</h3>
      <form className="form-stack" onSubmit={addMemory}>
        <label>
          Title
          <input name="title" required />
        </label>
        <label>
          Category
          <select name="category" defaultValue="FAMILY">
            {MEMORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Memory
          <textarea name="content" required />
        </label>
        <button className="btn btn-outline" type="submit" disabled={pending}>
          Save memory
        </button>
      </form>
      {memories.map((m) => (
        <div key={m.id} className="list-row">
          <div>
            <strong>{m.title}</strong>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{m.category}</div>
          </div>
        </div>
      ))}

      <h3 style={{ fontFamily: "var(--font-display)", marginTop: "2rem" }}>3. Timeline</h3>
      <button className="btn btn-solid" type="button" onClick={buildTimeline} disabled={pending}>
        Generate life timeline
      </button>
      <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
        {timeline.map((item) => (
          <div key={item.id} className="soft-card" style={{ boxShadow: "none" }}>
            <span className="badge">{item.eventType}</span>
            <h4 style={{ margin: "0.4rem 0" }}>{item.title}</h4>
            {item.eventDate && (
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{item.eventDate}</div>
            )}
            <p style={{ marginBottom: 0 }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
