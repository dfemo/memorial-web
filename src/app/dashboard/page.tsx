import Link from "next/link";
import { redirect } from "next/navigation";
import { Donut, EmptyState, StatTile, StatusPill } from "@/components/glass/charts";
import { Section, Widget } from "@/components/glass/collapsible";
import { FilterBar } from "@/components/glass/filter-bar";
import { Note, PageHead } from "@/components/glass/page-head";
import { countBy, matchesQuery } from "@/components/glass/status";
import { ApiError, apiV1, type Memorial } from "@/lib/api-v1";
import { requireAccessToken } from "@/lib/require-session";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const STATES = ["PUBLISHED", "DRAFT"] as const;
const PRIVACY = ["PUBLIC", "INVITE_ONLY", "PRIVATE"] as const;

const stateOf = (m: Memorial) => (m.published ? "PUBLISHED" : "DRAFT");

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAccessToken("/dashboard");
  const { q, status } = await searchParams;

  let memorials: Memorial[] = [];
  let loadError: string | null = null;

  try {
    memorials = await apiV1<Memorial[]>("/api/v1/memorials/mine");
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect(`/api/session/refresh?next=${encodeURIComponent("/dashboard")}`);
    }
    loadError = err instanceof Error ? err.message : "Could not load memorials.";
  }

  const shown = memorials.filter(
    (m) => (!status || stateOf(m) === status) && matchesQuery(q, m.displayName, m.slug, m.location),
  );
  const published = shown.filter((m) => m.published).length;
  const drafts = shown.length - published;
  const inviteOnly = shown.filter((m) => m.privacyLevel === "INVITE_ONLY").length;

  return (
    <div className="dash-shell">
      <PageHead title="My memorials" sub="Create, publish, and care for remembrances.">
        <Link href="/create" className="btn btn-solid">
          Create a Memorial
        </Link>
      </PageHead>

      {loadError && <Note kind="error">{loadError}</Note>}

      <FilterBar
        q={q}
        status={status}
        statuses={STATES}
        statusLabel="Published and drafts"
        placeholder="Filter by name or link"
        count={`${shown.length} of ${memorials.length}`}
      />

      <Section
        id="owner.summary"
        title="Summary"
        summary={`4 tiles · ${drafts} ${drafts === 1 ? "draft" : "drafts"}`}
      >
        <div className="gl-grid gl-grid-4">
          <StatTile
            id="owner.tile.all"
            title="All memorials"
            value={shown.length}
            caption={`of ${memorials.length}`}
          />
          <StatTile
            id="owner.tile.published"
            title="Published"
            value={published}
            caption="visible to visitors"
          />
          <StatTile
            id="owner.tile.drafts"
            title="Drafts"
            value={drafts}
            caption="not yet visible"
          />
          <StatTile
            id="owner.tile.invite"
            title="Invite only"
            value={inviteOnly}
            caption="shared by invite link"
          />
        </div>
      </Section>

      {memorials.length > 0 && (
        <Section
          id="owner.breakdown"
          title="Breakdown"
          summary={`2 charts · ${published} of ${shown.length} published`}
        >
          <div className="gl-grid gl-grid-2">
            <Widget
              id="owner.by-state"
              title="Memorials by publishing state"
              summary={`${published} of ${shown.length} published`}
            >
              <Donut data={countBy(shown, stateOf, STATES)} totalLabel="Memorials" />
            </Widget>
            <Widget
              id="owner.by-privacy"
              title="Memorials by visibility"
              summary={`${inviteOnly} invite only`}
            >
              <Donut data={countBy(shown, (m) => m.privacyLevel, PRIVACY)} totalLabel="Memorials" />
            </Widget>
          </div>
        </Section>
      )}

      <Widget id="owner.list" title="Memorials" summary={`${shown.length} listed`}>
        {!loadError && memorials.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            No memorials yet. Start with a name, a photo, and a few words of love.{" "}
            <Link href="/create">Create a memorial</Link>.
          </p>
        ) : shown.length === 0 && !loadError ? (
          <EmptyState title="No memorials match the filter" />
        ) : (
          shown.map((m) => (
            <div className="list-row" key={m.id}>
              <div>
                <strong>{m.displayName}</strong>
                <div className="gl-row-meta">
                  /{m.slug}
                  <StatusPill status={stateOf(m)} />
                  <StatusPill status={m.privacyLevel} />
                </div>
              </div>
              <div className="gl-row-actions">
                <Link href={`/memorial/${m.slug}`} className="btn btn-outline">
                  View
                </Link>
                {m.privacyLevel === "INVITE_ONLY" && (
                  <Link href={`/memorial/manage/${m.id}#invite-links`} className="btn btn-solid">
                    Generate invite link
                  </Link>
                )}
                <Link
                  href={`/memorial/manage/${m.id}`}
                  className={m.privacyLevel === "INVITE_ONLY" ? "btn btn-outline" : "btn btn-solid"}
                >
                  Manage
                </Link>
              </div>
            </div>
          ))
        )}
      </Widget>
    </div>
  );
}
