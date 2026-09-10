"use client";

import { useEffect, useState } from "react";

type InviteLink = {
  id: string;
  memorialId: string;
  token: string;
  label?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  revoked: boolean;
  useCount: number;
  path: string;
};

export function InviteLinkPanel({
  memorialId,
  privacyLevel,
  published,
}: {
  memorialId: string;
  privacyLevel: string;
  published: boolean;
}) {
  const [links, setLinks] = useState<InviteLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [latestUrl, setLatestUrl] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/proxy/memorials/${memorialId}/invite-links`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      setError((data as { error?: string }).error || `Could not load invites (${res.status})`);
      return;
    }
    setLinks(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load invite links."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memorialId]);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/memorials/${memorialId}/invite-links`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ label: "Family invite", expiresInDays: 30 }),
      });
      const data = (await res.json().catch(() => ({}))) as InviteLink & { error?: string };
      if (!res.ok) {
        setError(data.error || `Could not create invite (${res.status})`);
        setPending(false);
        return;
      }
      const url = `${window.location.origin}${data.path}`;
      setLatestUrl(url);
      await load();
      try {
        await navigator.clipboard.writeText(url);
        setCopiedId(data.id);
      } catch {
        /* clipboard may be blocked */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    } finally {
      setPending(false);
    }
  }

  async function copyLink(link: InviteLink) {
    const url = `${window.location.origin}${link.path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      setLatestUrl(url);
    } catch {
      setLatestUrl(url);
      setError("Copy failed — select and copy the link below.");
    }
  }

  async function revoke(linkId: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/memorials/${memorialId}/invite-links/${linkId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || `Could not revoke (${res.status})`);
      } else {
        await load();
      }
    } finally {
      setPending(false);
    }
  }

  const inviteOnly = privacyLevel === "INVITE_ONLY";

  return (
    <section className="soft-card" style={{ marginTop: "1.25rem" }} id="invite-links">
      <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Invite links</h2>
      <p style={{ color: "var(--muted)" }}>
        {inviteOnly
          ? "This memorial is invite-only. Generate a link to share with family and friends."
          : "Generate a private invite link. Switch visibility to Invite only for the link to be required."}
        {!published && (
          <>
            {" "}
            Publish the memorial so invited guests can open it.
          </>
        )}
      </p>

      {error && (
        <p role="alert" style={{ color: "#7a2e2e" }}>
          {error}
        </p>
      )}

      <button className="btn btn-solid" type="button" onClick={generate} disabled={pending}>
        {pending ? "Generating…" : "Generate invite link"}
      </button>

      {latestUrl && (
        <p style={{ marginTop: "1rem", wordBreak: "break-all" }}>
          <strong>Share this link:</strong>
          <br />
          <a href={latestUrl}>{latestUrl}</a>
          {copiedId && (
            <span style={{ color: "var(--accent)", marginLeft: "0.5rem" }}>Copied</span>
          )}
        </p>
      )}

      {links.length > 0 && (
        <div style={{ marginTop: "1.25rem", display: "grid", gap: "0.75rem" }}>
          {links.map((link) => (
            <div className="list-row" key={link.id}>
              <div>
                <strong>{link.label || "Invite"}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  Uses: {link.useCount}
                  {link.expiresAt
                    ? ` · Expires ${new Date(link.expiresAt).toLocaleDateString()}`
                    : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => copyLink(link)}
                  disabled={pending}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => revoke(link.id)}
                  disabled={pending}
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
