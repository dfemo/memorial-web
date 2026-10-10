"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { InlineScript } from "./collapsible";
import { Icon, type IconName } from "./icons";
import { initials } from "./status";

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  /** Extra path prefixes that should also mark this item as current. */
  also?: string[];
  /** For ?query links: current when the query param is absent. */
  isDefault?: boolean;
};

export type NavGroup = {
  heading: string;
  rail: { label: string; icon: IconName };
  items: NavItem[];
};

export type MenuLink = {
  label: string;
  href: string;
  icon: IconName;
  /** Use a full page load (route handlers such as sign-out). */
  plain?: boolean;
};

export type AccountMenuConfig = {
  name: string;
  email?: string;
  pill?: string;
  columns: [{ heading: string; items: MenuLink[] }, { heading: string; items: MenuLink[] }];
};

const THEME_KEY = "gl:theme";
const PANEL_KEY = "gl:panel";
const PREF_EVENT = "gl:pref";

function subscribePrefs(onChange: () => void) {
  window.addEventListener(PREF_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PREF_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function usePref(key: string) {
  const value = useSyncExternalStore(
    subscribePrefs,
    () => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const set = (next: string | null) => {
    try {
      if (next == null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(PREF_EVENT));
  };
  return [value, set] as const;
}

const NARROW = "(max-width: 1023px)";

function useNarrow() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(NARROW);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

const RESTORE = `(function(s){try{var r=s.parentElement,t=localStorage.getItem("${THEME_KEY}"),p=localStorage.getItem("${PANEL_KEY}");if(t)r.setAttribute("data-theme",t);if(p)r.setAttribute("data-panel",p)}catch(e){}})(document.currentScript)`;

function scoreItem(item: NavItem, pathname: string, params: URLSearchParams) {
  const [path, query] = item.href.split("?");
  if (query) {
    if (pathname !== path) return -1;
    for (const [k, v] of new URLSearchParams(query)) {
      const actual = params.get(k);
      if (actual === v || (actual == null && item.isDefault)) continue;
      return -1;
    }
    return 5000;
  }
  if (pathname === path) return 1000 + path.length;
  for (const prefix of [path, ...(item.also || [])]) {
    if (prefix !== "/" && pathname.startsWith(prefix + "/")) return prefix.length;
    if (pathname === prefix) return prefix.length;
  }
  return -1;
}

export function Shell({
  brand,
  groups,
  account,
  footnote,
  children,
}: {
  brand: { name: string; sub?: string };
  groups: NavGroup[];
  account: AccountMenuConfig;
  footnote?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [theme, setTheme] = usePref(THEME_KEY);
  const [panel, setPanel] = usePref(PANEL_KEY);
  const narrow = useNarrow();
  const [drawer, setDrawer] = useState(false);
  const panelId = useId();

  const collapsed = panel === "collapsed" || (panel == null && narrow);

  let active: { group: NavGroup; item: NavItem } | null = null;
  let best = -1;
  for (const group of groups) {
    for (const item of group.items) {
      const score = scoreItem(item, pathname, params);
      if (score > best) {
        best = score;
        active = { group, item };
      }
    }
  }

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <div
      className="gl-app"
      data-theme={theme || undefined}
      data-panel={panel || undefined}
      data-drawer={drawer ? "open" : undefined}
      suppressHydrationWarning
    >
      <InlineScript html={RESTORE} />
      <div className="gl-backdrop" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <nav className="gl-rail" aria-label="Sections">
        <span className="gl-rail-brand" aria-hidden="true">
          {brand.name.charAt(0)}
        </span>
        {groups.map((g) => (
          <Link
            key={g.heading}
            href={g.items[0].href}
            className="gl-rail-item"
            aria-current={active?.group === g ? "true" : undefined}
          >
            <Icon name={g.rail.icon} size={20} />
            {g.rail.label}
          </Link>
        ))}
        <button
          type="button"
          className="gl-rail-expand"
          aria-label="Expand navigation panel"
          aria-expanded={!collapsed}
          aria-controls={panelId}
          onClick={() => setPanel("open")}
        >
          <Icon name="chevrons-right" size={14} />
        </button>
      </nav>

      <aside className="gl-panel" id={panelId} aria-label={brand.name}>
        <div className="gl-panel-inner">
          <div className="gl-panel-head">
            <p className="gl-panel-title">
              {brand.name}
              {brand.sub && <span className="gl-panel-sub">{brand.sub}</span>}
            </p>
            <button
              type="button"
              className="gl-icon-btn gl-panel-collapse"
              aria-label="Collapse navigation panel"
              aria-expanded={!collapsed}
              aria-controls={panelId}
              onClick={() => setPanel("collapsed")}
            >
              <Icon name="chevrons-left" size={16} />
            </button>
          </div>
          {groups.map((g) => (
            <div className="gl-panel-group" key={g.heading}>
              <p className="gl-panel-heading">{g.heading}</p>
              {g.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="gl-panel-link"
                  aria-current={active?.item === item ? "page" : undefined}
                  onClick={() => setDrawer(false)}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          {footnote && <p className="gl-panel-foot">{footnote}</p>}
        </div>
      </aside>

      {drawer && (
        <button
          type="button"
          className="gl-scrim"
          aria-label="Close navigation"
          onClick={() => setDrawer(false)}
        />
      )}

      <div className="gl-main">
        <header className="gl-topbar">
          <button
            type="button"
            className="gl-icon-btn gl-drawer-btn"
            aria-label="Open navigation"
            aria-expanded={drawer}
            aria-controls={panelId}
            onClick={() => setDrawer(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="gl-crumbs">
            {active ? (
              <>
                <span>{active.group.heading}</span>
                <Icon name="chevron-right" size={14} />
                <strong>{active.item.label}</strong>
              </>
            ) : (
              <strong>{brand.name}</strong>
            )}
          </div>
          <div className="gl-topbar-end">
            <AccountMenu brand={brand.name} config={account} theme={theme} onTheme={setTheme} />
          </div>
        </header>
        <div className="gl-content">{children}</div>
      </div>
    </div>
  );
}

const THEMES: { value: string | null; label: string; icon: IconName }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: null, label: "System", icon: "monitor" },
];

function AccountMenu({
  brand,
  config,
  theme,
  onTheme,
}: {
  brand: string;
  config: AccountMenuConfig;
  theme: string | null;
  onTheme: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function close(returnFocus: boolean) {
    setOpen(false);
    setThemeOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setThemeOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const list = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') || [],
    );
    const current = document.activeElement as HTMLElement;
    const i = list.indexOf(current);
    const focus = (el?: HTMLElement) => {
      e.preventDefault();
      el?.focus();
    };

    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") {
      close(false);
    } else if (e.key === "ArrowDown") {
      focus(list[(i + 1) % list.length]);
    } else if (e.key === "ArrowUp") {
      focus(list[(i - 1 + list.length) % list.length]);
    } else if (e.key === "Home") {
      focus(list[0]);
    } else if (e.key === "End") {
      focus(list[list.length - 1]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const col = current?.dataset.col;
      if (col !== "0" && col !== "1") return;
      const same = list.filter((el) => el.dataset.col === col);
      const other = list.filter((el) => el.dataset.col === (col === "0" ? "1" : "0"));
      focus(other[Math.min(same.indexOf(current), other.length - 1)]);
    }
  }

  const themeLabel = THEMES.find((t) => t.value === theme)?.label || "System";

  return (
    <div className="gl-menu-wrap" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="gl-avatar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${config.name}`}
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="gl-avatar">{initials(config.name)}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="gl-scrim gl-menu-scrim"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => close(false)}
          />
          <div
            ref={menuRef}
            id={menuId}
            className="gl-menu"
            role="menu"
            aria-label="Account"
            onKeyDown={onKeyDown}
          >
            <div className="gl-menu-head">
              <span className="gl-rail-brand" aria-hidden="true">
                {brand.charAt(0)}
              </span>
              <div className="gl-menu-who">
                <strong>{config.name}</strong>
                {config.email && <span>{config.email}</span>}
              </div>
              {config.pill && <span className="gl-pill">{config.pill}</span>}
            </div>

            <div className="gl-menu-cols">
              {config.columns.map((col, c) => (
                <div key={col.heading} role="group" aria-label={col.heading}>
                  <p className="gl-menu-heading">{col.heading}</p>
                  {col.items.map((item) =>
                    item.plain ? (
                      <a
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        tabIndex={-1}
                        data-col={c}
                        className="gl-menu-item"
                      >
                        <Icon name={item.icon} size={16} />
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        tabIndex={-1}
                        data-col={c}
                        className="gl-menu-item"
                        onClick={() => close(false)}
                      >
                        <Icon name={item.icon} size={16} />
                        {item.label}
                      </Link>
                    ),
                  )}
                </div>
              ))}
            </div>

            <div className="gl-menu-full">
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                className="gl-menu-item"
                aria-haspopup="true"
                aria-expanded={themeOpen}
                onClick={() => setThemeOpen((v) => !v)}
              >
                <Icon name="palette" size={16} />
                Change theme
                <span className="gl-menu-end">
                  {themeLabel}
                  <Icon name="chevron-right" size={14} />
                </span>
              </button>
              {themeOpen && (
                <div className="gl-menu-sub" role="group" aria-label="Theme">
                  {THEMES.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      role="menuitemradio"
                      aria-checked={theme === t.value}
                      tabIndex={-1}
                      className="gl-menu-item"
                      onClick={() => {
                        onTheme(t.value);
                        close(true);
                      }}
                    >
                      <Icon name={t.icon} size={16} />
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
