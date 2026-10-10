"use client";

import { useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import { Icon } from "./icons";

const KEY = "gl:collapse:v1";
const EVENT = "gl:collapse";

let cacheRaw: string | null = null;
let cacheMap: Record<string, boolean> = {};

function readMap(): Record<string, boolean> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* storage blocked: state lives for this page only */
    return cacheMap;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cacheMap = raw ? JSON.parse(raw) : {};
    } catch {
      cacheMap = {};
    }
  }
  return cacheMap;
}

function writeMany(ids: string[], collapsed: boolean) {
  const next = { ...readMap() };
  for (const id of ids) {
    if (collapsed) next[id] = true;
    else delete next[id];
  }
  cacheMap = next;
  cacheRaw = JSON.stringify(next);
  try {
    window.localStorage.setItem(KEY, cacheRaw);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Ids of the collapsibles mounted on the current page. */
let mounted: string[] = [];
const NONE: string[] = [];

function useCollapsed(id: string) {
  useEffect(() => {
    mounted = [...mounted, id];
    window.dispatchEvent(new Event(EVENT));
    return () => {
      mounted = mounted.filter((m) => m !== id);
      window.dispatchEvent(new Event(EVENT));
    };
  }, [id]);

  const collapsed = useSyncExternalStore(
    subscribe,
    () => readMap()[id] === true,
    () => false,
  );
  return [collapsed, () => writeMany([id], !collapsed)] as const;
}

/**
 * Runs while the HTML is parsed (hard loads only), so persisted state is
 * applied before first paint. See Next's "preventing flash before hydration".
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function restoreScript(id: string) {
  const safeId = JSON.stringify(id).replace(/</g, "\\u003c");
  return `(function(s){try{var m=JSON.parse(localStorage.getItem(${JSON.stringify(KEY)})||"{}");if(m[${safeId}]){var r=s.parentElement;r.setAttribute("data-collapsed","true");var b=r.querySelector("[aria-controls]");if(b)b.setAttribute("aria-expanded","false")}}catch(e){}})(document.currentScript)`;
}

/** A dashboard row ("Summary", "Breakdown") that collapses to its header. */
export function Section({
  id,
  title,
  summary,
  children,
}: {
  id: string;
  title: string;
  /** One line describing what is hidden while collapsed. */
  summary?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, toggle] = useCollapsed(id);
  const bodyId = useId();
  return (
    <section
      className="gl-section"
      data-gl-collapsible={id}
      data-collapsed={collapsed}
      suppressHydrationWarning
    >
      <header className="gl-section-head">
        <button
          type="button"
          className="gl-section-toggle"
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          onClick={toggle}
          suppressHydrationWarning
        >
          <Icon name="chevron-down" size={16} />
          {title}
        </button>
        {summary && <span className="gl-section-summary">{summary}</span>}
      </header>
      <div className="gl-collapse-body" id={bodyId} inert={collapsed}>
        <div>{children}</div>
      </div>
      <InlineScript html={restoreScript(id)} />
    </section>
  );
}

/** A glass card with a header row that collapses to just that header. */
export function Widget({
  id,
  title,
  summary,
  actions,
  flush,
  tile,
  children,
}: {
  id: string;
  title: ReactNode;
  /** Headline fact shown in the header while collapsed. */
  summary?: ReactNode;
  actions?: ReactNode;
  /** No body padding: for tables that run edge to edge. */
  flush?: boolean;
  tile?: boolean;
  children: ReactNode;
}) {
  const [collapsed, toggle] = useCollapsed(id);
  const bodyId = useId();
  return (
    <section
      className="gl-card gl-widget"
      data-gl-collapsible={id}
      data-collapsed={collapsed}
      suppressHydrationWarning
    >
      <header className="gl-widget-head">
        <h3 className="gl-widget-title">{title}</h3>
        {summary != null && <span className="gl-widget-summary">{summary}</span>}
        <span className="gl-widget-actions">{actions}</span>
        <button
          type="button"
          className="gl-icon-btn gl-chevron"
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          aria-label={collapsed ? "Expand" : "Collapse"}
          onClick={toggle}
          suppressHydrationWarning
        >
          <Icon name="chevron-down" size={16} />
        </button>
      </header>
      <div className="gl-collapse-body" id={bodyId} inert={collapsed}>
        <div>
          <div className={tile ? "gl-tile-body" : "gl-widget-body"} data-flush={flush || undefined}>
            {children}
          </div>
        </div>
      </div>
      <InlineScript html={restoreScript(id)} />
    </section>
  );
}

/** Collapses or expands every section and widget on the current page. */
export function CollapseAllButton() {
  const map = useSyncExternalStore(subscribe, readMap, () => cacheMap);
  const ids = useSyncExternalStore(
    subscribe,
    () => mounted,
    () => NONE,
  );

  const anyOpen = ids.some((id) => !map[id]);
  return (
    <button
      type="button"
      className="gl-btn gl-btn-quiet"
      onClick={() => writeMany(ids, anyOpen)}
      disabled={ids.length === 0}
    >
      <Icon name={anyOpen ? "collapse" : "expand"} size={16} />
      {anyOpen ? "Collapse all" : "Expand all"}
    </button>
  );
}
