import Link from "next/link";
import { Bars, Donut, EmptyState, StatTile, StatusPill } from "@/components/glass/charts";
import { Section, Widget } from "@/components/glass/collapsible";
import { FilterBar } from "@/components/glass/filter-bar";
import { PageHead } from "@/components/glass/page-head";
import { countBy, humanize, matchesQuery, percent } from "@/components/glass/status";
import { platformFetch } from "@/lib/platform";
import { requireAccessToken } from "@/lib/require-session";

type ServiceRequest = {
  id: number;
  title: string;
  status: string;
  category: string;
  notes?: string;
  obtainable?: string;
};

export const metadata = { title: "Service requests" };
export const dynamic = "force-dynamic";

const STATUSES = ["OPEN", "QUOTED", "ACCEPTED", "DECLINED", "FULFILLED", "CANCELLED"] as const;

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const token = await requireAccessToken("/dashboard/requests");
  const { q, status } = await searchParams;

  let requests: ServiceRequest[] = [];
  try {
    const res = await platformFetch("/api/requests/mine", { token });
    if (res.ok) requests = await res.json();
  } catch {
    /* API may be offline */
  }

  const shown = requests.filter(
    (r) =>
      (!status || r.status === status) &&
      matchesQuery(q, r.title, r.category, r.notes, r.obtainable),
  );
  const n = (s: string) => shown.filter((r) => r.status === s).length;

  return (
    <div className="dash-shell">
      <PageHead
        title="Service requests"
        sub="Share notes and what is obtainable with vendors, and follow their responses."
      >
        <Link href="/dashboard/requests/new" className="btn btn-solid">
          New request
        </Link>
      </PageHead>

      <FilterBar
        q={q}
        status={status}
        statuses={STATUSES}
        placeholder="Filter by title, category, or notes"
        count={`${shown.length} of ${requests.length}`}
      />

      <Section id="my-requests.summary" title="Summary" summary={`4 tiles · ${n("OPEN")} open`}>
        <div className="gl-grid gl-grid-4">
          <StatTile
            id="my-requests.tile.all"
            title="All requests"
            value={shown.length}
            caption={`of ${requests.length}`}
          />
          <StatTile
            id="my-requests.tile.open"
            title="Open"
            value={n("OPEN")}
            caption="waiting for a vendor"
          />
          <StatTile
            id="my-requests.tile.quoted"
            title="Quoted"
            value={n("QUOTED")}
            caption="waiting for you"
          />
          <StatTile
            id="my-requests.tile.done"
            title="Fulfilled"
            value={n("FULFILLED")}
            caption={`${percent(n("FULFILLED"), shown.length)}% of shown`}
          />
        </div>
      </Section>

      {requests.length > 0 && (
        <Section
          id="my-requests.breakdown"
          title="Breakdown"
          summary={`2 charts · Open ${percent(n("OPEN"), shown.length)}%`}
        >
          <div className="gl-grid gl-grid-2">
            <Widget
              id="my-requests.by-status"
              title="Requests by status"
              summary={`Open ${percent(n("OPEN"), shown.length)}%`}
            >
              <Donut data={countBy(shown, (r) => r.status, STATUSES)} totalLabel="Requests" />
            </Widget>
            <Widget
              id="my-requests.by-category"
              title="Requests by category"
              summary={`${shown.length} requests`}
            >
              <Bars data={countBy(shown, (r) => r.category)} />
            </Widget>
          </div>
        </Section>
      )}

      <Widget id="my-requests.list" title="Requests" summary={`${shown.length} listed`}>
        {requests.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            No requests yet. Start one to share notes and what is obtainable with vendors.
          </p>
        ) : shown.length === 0 ? (
          <EmptyState title="No requests match the filter" />
        ) : (
          shown.map((r) => (
            <div className="list-row" key={r.id}>
              <div>
                <strong>{r.title}</strong>
                <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{humanize(r.category)}</div>
              </div>
              <StatusPill status={r.status} />
            </div>
          ))
        )}
      </Widget>
    </div>
  );
}
