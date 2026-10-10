import type { ReactNode } from "react";
import { Widget } from "./collapsible";
import { humanize, initials, percent, toneOf, type Tone } from "./status";

export function StatusPill({ status, tone }: { status: string; tone?: Tone }) {
  return (
    <span className="gl-pill" data-tone={tone || toneOf(status)}>
      {humanize(status)}
    </span>
  );
}

/** Number tile: one large figure with a small caption beneath it. */
export function StatTile({
  id,
  title,
  value,
  caption,
}: {
  id: string;
  title: string;
  value: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <Widget id={id} title={title} summary={value} tile>
      <div className="gl-tile-value">{value}</div>
      {caption && <div className="gl-tile-caption">{caption}</div>}
    </Widget>
  );
}

export type Slice = { label: string; value: number; tone?: Tone };

const R = 44;
const C = 2 * Math.PI * R;
const GAP = 2;

/** Donut with the total in the centre and a legend listing every slice. */
export function Donut({ data, totalLabel = "Total" }: { data: Slice[]; totalLabel?: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const visible = data.filter((d) => d.value > 0);
  const slices = visible.map((d, i) => ({
    ...d,
    len: (d.value / total) * C,
    start: (visible.slice(0, i).reduce((sum, v) => sum + v.value, 0) / total) * C,
  }));

  return (
    <div className="gl-donut">
      <svg viewBox="0 0 120 120" role="img" aria-label={`${totalLabel}: ${total}`}>
        <circle className="gl-donut-track" cx="60" cy="60" r={R} />
        <g transform="rotate(-90 60 60)">
          {slices.map((d) => {
            const dash = Math.max(d.len - (slices.length > 1 ? GAP : 0), 0.5);
            return (
              <circle
                key={d.label}
                className="gl-donut-slice"
                data-tone={d.tone || toneOf(d.label)}
                cx="60"
                cy="60"
                r={R}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-d.start}
              >
                <title>{`${humanize(d.label)}: ${d.value} (${percent(d.value, total)}%)`}</title>
              </circle>
            );
          })}
        </g>
        <text className="gl-donut-total" x="60" y="62" textAnchor="middle" dominantBaseline="middle">
          {total}
        </text>
        <text className="gl-donut-label" x="60" y="79" textAnchor="middle">
          {totalLabel}
        </text>
      </svg>
      <ul className="gl-legend">
        {data.map((d) => (
          <li key={d.label}>
            <i className="gl-swatch" data-tone={d.tone || toneOf(d.label)} />
            {humanize(d.label)}
            <span className="gl-legend-val">
              <b>{d.value}</b>
              {percent(d.value, total)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function niceMax(v: number) {
  if (v <= 2) return 2;
  if (v <= 4) return 4;
  if (v <= 6) return 6;
  const m = 10 ** Math.floor(Math.log10(v));
  for (const f of [1, 2, 4, 5, 10]) if (v <= f * m) return f * m;
  return 10 * m;
}

const MAX_BARS = 8;

/** Vertical bars: one per label, count above the bar, avatar and name beneath. */
export function Bars({ data, axis = "Count" }: { data: { label: string; value: number }[]; axis?: string }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, MAX_BARS);
  const rest = sorted.slice(MAX_BARS).reduce((sum, d) => sum + d.value, 0);
  if (rest > 0) shown.push({ label: "Other", value: rest });

  const max = niceMax(Math.max(0, ...shown.map((d) => d.value)));
  const ticks = [max, max / 2, 0];

  if (shown.length === 0) {
    return <div className="gl-empty">Nothing to chart yet.</div>;
  }

  return (
    <div className="gl-bars">
      <div className="gl-bars-axis">{axis}</div>
      <div className="gl-bars-plot">
        {ticks.map((t) => (
          <div
            key={t}
            className="gl-bars-tick"
            style={{ bottom: `calc(${t / max} * (100% - 20px))` }}
            aria-hidden="true"
          >
            <span>{t}</span>
          </div>
        ))}
        {shown.map((d) => (
          <div className="gl-bar-col" key={d.label} title={`${humanize(d.label)}: ${d.value}`}>
            <span className="gl-bar-val">{d.value}</span>
            <div className="gl-bar" style={{ height: `calc(${d.value / max} * (100% - 20px))` }} />
          </div>
        ))}
      </div>
      <div className="gl-bars-labels">
        {shown.map((d) => (
          <div key={d.label}>
            <i className="gl-avatar" style={{ fontStyle: "normal" }} aria-hidden="true">
              {initials(d.label)}
            </i>
            <span>{humanize(d.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="gl-empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}
