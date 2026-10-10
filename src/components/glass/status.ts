export type Tone = "neutral" | "progress" | "info" | "good" | "bad" | "hold" | "accent";

const TONES: Record<string, Tone> = {
  // not started
  OPEN: "neutral",
  DRAFT: "neutral",
  PRIVATE: "neutral",
  // in progress
  PENDING: "progress",
  QUOTED: "progress",
  IN_REVIEW: "progress",
  REVIEWING: "progress",
  // agreed, not yet finished
  ACCEPTED: "info",
  INVITE_ONLY: "info",
  // done
  APPROVED: "good",
  SUCCEEDED: "good",
  RESOLVED: "good",
  FULFILLED: "good",
  COMPLETED: "good",
  PUBLISHED: "good",
  PUBLIC: "good",
  // stuck
  REJECTED: "bad",
  FAILED: "bad",
  DECLINED: "bad",
  // set aside
  SUSPENDED: "hold",
  DISMISSED: "hold",
  REFUNDED: "hold",
  CANCELLED: "hold",
};

export function toneOf(status: string | undefined | null): Tone {
  return TONES[String(status || "").toUpperCase()] || "neutral";
}

/** "IN_REVIEW" → "In review" */
export function humanize(value: string | undefined | null) {
  const s = String(value || "").replaceAll("_", " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Counts per key, in `order` first, then any other keys as they appear. */
export function countBy<T>(items: T[], key: (item: T) => string, order: readonly string[] = []) {
  const counts = new Map<string, number>(order.map((k) => [k, 0]));
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value }));
}

/** Case-insensitive match of a free-text query against any of the fields. */
export function matchesQuery(q: string | undefined, ...fields: unknown[]) {
  const needle = (q || "").trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) => String(f ?? "").toLowerCase().includes(needle));
}

export function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function initials(name: string) {
  const words = name.trim().split(/[\s_]+/).filter(Boolean);
  return ((words[0]?.[0] || "?") + (words[1]?.[0] || "")).toUpperCase();
}
