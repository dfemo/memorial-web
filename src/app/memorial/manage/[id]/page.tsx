import Link from "next/link";
import { redirect } from "next/navigation";
import { InviteLinkPanel } from "@/components/memorial/invite-link-panel";
import { LegacyAiPanel } from "@/components/memorial/legacy-ai-panel";
import { MemorialEditForm } from "@/components/memorial/memorial-edit-form";
import {
  ApiError,
  apiV1,
  getAccessToken,
  getRefreshToken,
  type MemorialDetail,
} from "@/lib/api-v1";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ManageMemorialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; privacy?: string; published?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const token = await getAccessToken();
  const refresh = await getRefreshToken();

  if (!token && refresh) {
    redirect(`/api/session/refresh?next=${encodeURIComponent(`/memorial/manage/${id}`)}`);
  }
  if (!token) {
    redirect(`/sign-in?next=${encodeURIComponent(`/memorial/manage/${id}`)}`);
  }

  let detail: MemorialDetail | null = null;
  let loadError: string | null = null;

  try {
    detail = await apiV1<MemorialDetail>(`/api/v1/memorials/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403) && refresh) {
      redirect(`/api/session/refresh?next=${encodeURIComponent(`/memorial/manage/${id}`)}`);
    }
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect(
        `/sign-in?next=${encodeURIComponent(`/memorial/manage/${id}`)}&error=` +
          encodeURIComponent("Session expired. Please sign in again."),
      );
    }
    loadError = err instanceof Error ? err.message : "Could not load this memorial.";
  }

  if (!detail?.memorial) {
    return (
      <div className="dash-shell">
        <p>
          <Link href="/dashboard">← Dashboard</Link>
        </p>
        <div className="soft-card">
          <h1 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Unable to open memorial</h1>
          <p style={{ color: "var(--muted)" }}>
            {loadError || "This memorial could not be loaded. It may have been removed."}
          </p>
          <Link href="/dashboard" className="btn btn-solid">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const m = detail.memorial;

  return (
    <div className="dash-shell">
      <p>
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      <h1 style={{ fontFamily: "var(--font-display)" }}>{m.displayName}</h1>
      <p style={{ color: "var(--muted)" }}>
        <span className="badge">{m.privacyLevel}</span>{" "}
        <span className="badge">{m.published ? "Published" : "Draft"}</span>{" "}
        <span className="badge">{m.plan}</span>
      </p>

      {sp.saved && (
        <p role="status" className="soft-card" style={{ color: "var(--accent)" }}>
          Saved. Visibility: <strong>{m.privacyLevel}</strong> ·{" "}
          {m.published ? "Published" : "Draft"}
          {m.published && m.privacyLevel === "PUBLIC"
            ? " — this memorial can appear on Explore."
            : m.published && m.privacyLevel === "INVITE_ONLY"
              ? " — invite only: generate and share an invite link."
              : m.published && m.privacyLevel === "PRIVATE"
                ? " — private: only you can view."
                : " — draft: not publicly visible."}
        </p>
      )}
      {sp.error && (
        <p role="alert" className="soft-card" style={{ color: "#7a2e2e" }}>
          {sp.error}
        </p>
      )}

      <div className="soft-card">
        <p style={{ marginTop: 0 }}>
          Public page: <Link href={`/memorial/${m.slug}`}>/memorial/{m.slug}</Link>
        </p>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Stories: {detail.stories.length} · Photos: {detail.photos.length} · Tributes:{" "}
          {detail.tributes.length} · Contributors: {detail.contributors.length}
        </p>
      </div>

      <section className="soft-card" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Edit memorial</h2>
        <p style={{ color: "var(--muted)" }}>
          Update the life story, photos, visibility, and publish status.
        </p>
        <MemorialEditForm memorial={m} />
      </section>

      <InviteLinkPanel
        memorialId={m.id}
        privacyLevel={m.privacyLevel}
        published={m.published}
      />

      <LegacyAiPanel memorialId={m.id} />
    </div>
  );
}
