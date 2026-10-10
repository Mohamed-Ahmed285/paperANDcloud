import type { ContentType, Scope, SavedItem, SortKey } from "./types";

export interface ViewState {
  scope: Scope;
  query: string;
  type: ContentType | "all";
  tag: string | null;
  sort: SortKey;
}

export function domainOf(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function formatBytes(n?: number): string | undefined {
  if (n === undefined) return undefined;
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 10 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(d);
}

function haystack(item: SavedItem): string {
  return [item.title, item.content, item.url, domainOf(item.url), item.description, item.author, item.source, item.filename, ...item.tags]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function sortLabel(item: SavedItem): string {
  return (item.title ?? item.filename ?? item.content?.slice(0, 80) ?? domainOf(item.url) ?? "").toLowerCase();
}

const comparators: Record<SortKey, (a: SavedItem, b: SavedItem) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  alpha: (a, b) => sortLabel(a).localeCompare(sortLabel(b), undefined, { sensitivity: "base" }),
};

export function applyView(items: SavedItem[], view: ViewState): SavedItem[] {
  const q = view.query.trim().toLowerCase();
  const terms = q ? q.split(/\s+/) : [];
  return items
    .filter((i) => {
      if (view.scope.kind === "favorites" && !i.isFavorite) return false;
      if (view.scope.kind === "collection" && i.collectionId !== view.scope.id) return false;
      if (view.type !== "all" && i.type !== view.type) return false;
      if (view.tag && !i.tags.includes(view.tag)) return false;
      if (terms.length) {
        const h = haystack(i);
        if (!terms.every((t) => h.includes(t))) return false;
      }
      return true;
    })
    .sort(comparators[view.sort]);
}
