import Link from "next/link";
import { redirect } from "next/navigation";
import { LegacyAiPanel } from "@/components/memorial/legacy-ai-panel";
import { apiV1, getAccessToken, type MemorialDetail } from "@/lib/api-v1";

export default async function ManageMemorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in");
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
        <span className="badge">{m.plan}</span>
      </p>
      <div className="soft-card">
        <p>
          Public page: <Link href={`/memorial/${m.slug}`}>/memorial/{m.slug}</Link>
        </p>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>
          Stories: {detail.stories.length} · Photos: {detail.photos.length} · Tributes:{" "}
          {detail.tributes.length} · Contributors: {detail.contributors.length}
        </p>
      </div>

      <LegacyAiPanel memorialId={m.id} />
    </div>
  );
}
