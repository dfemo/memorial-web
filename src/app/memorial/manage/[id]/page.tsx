import Link from "next/link";
import { redirect } from "next/navigation";
import { LegacyAiPanel } from "@/components/memorial/legacy-ai-panel";
import { MemorialEditForm } from "@/components/memorial/memorial-edit-form";
import { apiV1, getAccessToken, type MemorialDetail } from "@/lib/api-v1";

export const dynamic = "force-dynamic";

export default async function ManageMemorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in?next=/dashboard");
  const { id } = await params;

  let detail: MemorialDetail;
  try {
    detail = await apiV1<MemorialDetail>(`/api/v1/memorials/${id}`);
  } catch {
    redirect("/dashboard");
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
          Update the life story, photos, visibility, and publish status. Explore only lists
          memorials that are both <strong>Published</strong> and <strong>Public</strong>.
        </p>
        <MemorialEditForm memorial={m} />
      </section>

      <LegacyAiPanel memorialId={m.id} />
    </div>
  );
}
