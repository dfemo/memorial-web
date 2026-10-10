"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { CollapseAllButton } from "./collapsible";
import { Icon } from "./icons";
import { humanize } from "./status";

/**
 * Page toolbar. The filter lives in the URL (?q=&status=), so the server
 * re-renders every tile, chart, and table on the page from one shared state.
 */
export function FilterBar({
  q = "",
  status = "",
  statuses,
  statusLabel = "All statuses",
  placeholder = "Type to filter",
  preserve,
  count,
  children,
}: {
  q?: string;
  status?: string;
  /** Omit to hide the status filter. */
  statuses?: readonly string[];
  statusLabel?: string;
  placeholder?: string;
  /** Other query params to keep when the filter changes (e.g. the active tab). */
  preserve?: Record<string, string | undefined>;
  /** e.g. "12 of 40" */
  count?: ReactNode;
  children?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(q);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function push(next: { q?: string; status?: string }) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(preserve || {})) if (v) params.set(k, v);
    const nq = (next.q ?? text).trim();
    const ns = next.status ?? status;
    if (nq) params.set("q", nq);
    if (ns) params.set("status", ns);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function onText(value: string) {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push({ q: value }), 250);
  }

  const applied = Boolean(text.trim() || status);

  return (
    <div className="gl-toolbar" data-pending={pending} data-open={open} role="search">
      <button
        type="button"
        className="gl-btn gl-filters-toggle"
        aria-expanded={open}
        data-applied={applied}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="filter" size={16} />
        Filters
      </button>
      <div className="gl-toolbar-fields">
        <label className="gl-field">
          <Icon name="search" size={16} />
          <input
            type="search"
            value={text}
            placeholder={placeholder}
            aria-label={placeholder}
            data-applied={Boolean(text.trim())}
            onChange={(e) => onText(e.target.value)}
          />
        </label>
        {statuses && (
          <select
            aria-label="Filter by status"
            value={status}
            data-applied={Boolean(status)}
            onChange={(e) => push({ status: e.target.value })}
          >
            <option value="">{statusLabel}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
        )}
        {applied && (
          <button
            type="button"
            className="gl-btn gl-btn-quiet"
            onClick={() => {
              setText("");
              if (timer.current) clearTimeout(timer.current);
              push({ q: "", status: "" });
            }}
          >
            <Icon name="x" size={14} />
            Clear
          </button>
        )}
        {count != null && <span className="gl-toolbar-count">{count}</span>}
      </div>
      <div className="gl-toolbar-end">
        {children}
        <CollapseAllButton />
      </div>
    </div>
  );
}

/** Toolbar for pages with nothing to filter: just the page-level controls. */
export function Toolbar({ children }: { children?: ReactNode }) {
  return (
    <div className="gl-toolbar">
      <div className="gl-toolbar-fields" style={{ display: "flex" }}>
        {children}
      </div>
      <div className="gl-toolbar-end">
        <CollapseAllButton />
      </div>
    </div>
  );
}
