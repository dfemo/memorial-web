"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Memorial } from "@/lib/api-v1";

export function MemorialEditForm({ memorial }: { memorial: Memorial }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const body = {
      firstName: String(fd.get("firstName") || ""),
      middleName: String(fd.get("middleName") || "") || null,
      lastName: String(fd.get("lastName") || ""),
      dateOfBirth: String(fd.get("dateOfBirth") || "") || null,
      dateOfDeath: String(fd.get("dateOfDeath") || "") || null,
      biography: String(fd.get("biography") || "") || null,
      serviceInfo: String(fd.get("serviceInfo") || "") || null,
      location: String(fd.get("location") || "") || null,
      privacyLevel: String(fd.get("privacyLevel") || "PUBLIC"),
      profilePhotoUrl: String(fd.get("profilePhotoUrl") || "") || null,
      coverPhotoUrl: String(fd.get("coverPhotoUrl") || "") || null,
      published: String(fd.get("published") || "false") === "true",
      slug: String(fd.get("slug") || "") || null,
    };

    try {
      const res = await fetch(`/api/proxy/memorials/${memorial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; slug?: string };
      if (!res.ok) {
        setError(data.error || `Save failed (${res.status})`);
        setPending(false);
        return;
      }
      setSaved(true);
      setPending(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setPending(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      {error && (
        <p role="alert" style={{ color: "#7a2e2e" }}>
          {error}
        </p>
      )}
      {saved && (
        <p role="status" style={{ color: "var(--accent)" }}>
          Changes saved.
        </p>
      )}

      <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr 1fr" }}>
        <label>
          First name
          <input name="firstName" defaultValue={memorial.firstName} required />
        </label>
        <label>
          Middle
          <input name="middleName" defaultValue={memorial.middleName || ""} />
        </label>
        <label>
          Last name
          <input name="lastName" defaultValue={memorial.lastName} required />
        </label>
      </div>

      <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
        <label>
          Date of birth
          <input
            name="dateOfBirth"
            type="date"
            defaultValue={memorial.dateOfBirth?.slice(0, 10) || ""}
          />
        </label>
        <label>
          Date of passing
          <input
            name="dateOfDeath"
            type="date"
            defaultValue={memorial.dateOfDeath?.slice(0, 10) || ""}
          />
        </label>
      </div>

      <label>
        Life story
        <textarea name="biography" defaultValue={memorial.biography || ""} rows={5} />
      </label>
      <label>
        Service information
        <textarea name="serviceInfo" defaultValue={memorial.serviceInfo || ""} rows={3} />
      </label>
      <label>
        Location
        <input name="location" defaultValue={memorial.location || ""} />
      </label>

      <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr" }}>
        <label>
          Profile photo URL
          <input name="profilePhotoUrl" defaultValue={memorial.profilePhotoUrl || ""} />
        </label>
        <label>
          Cover photo URL
          <input name="coverPhotoUrl" defaultValue={memorial.coverPhotoUrl || ""} />
        </label>
      </div>

      <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "1fr 1fr 1fr" }}>
        <label>
          Visibility
          <select name="privacyLevel" defaultValue={memorial.privacyLevel}>
            <option value="PUBLIC">Public (listed on Explore)</option>
            <option value="INVITE_ONLY">Invite only</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>
        <label>
          Publish status
          <select name="published" defaultValue={memorial.published ? "true" : "false"}>
            <option value="true">Published</option>
            <option value="false">Draft (not publicly visible)</option>
          </select>
        </label>
        <label>
          URL slug
          <input name="slug" defaultValue={memorial.slug} required />
        </label>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>
        Public pages require <strong>Published</strong> and usually <strong>Public</strong> visibility.
        Invite-only and private memorials stay off Explore.
      </p>

      <button className="btn btn-solid" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
