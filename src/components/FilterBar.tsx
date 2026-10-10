import { LayoutGrid, List, PanelsTopLeft } from "lucide-react";
import { CONTENT_TYPES, type ContentType, type SortKey } from "@/lib/types";
import { SortMenu } from "./SortMenu";
import { TYPE_META } from "./typeMeta";
import { Select } from "./ui/Field";

export type Layout = "grid" | "masonry" | "list";
const LAYOUTS: { key: Layout; label: string; icon: typeof List }[] = [
  { key: "grid", label: "Grid view", icon: LayoutGrid },
  { key: "masonry", label: "Masonry view", icon: PanelsTopLeft },
  { key: "list", label: "List view", icon: List },
];

export function FilterBar({
  type, onType, tag, tags, onTag, sort, onSort, layout, onLayout, onReset, filtered,
}: {
  type: ContentType | "all";
  onType: (t: ContentType | "all") => void;
  tag: string | null;
  tags: string[];
  onTag: (t: string | null) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  layout: Layout;
  onLayout: (l: Layout) => void;
  onReset: () => void;
  filtered: boolean;
}) {
  // Selected tab is shown with weight AND an underline, so it doesn't rely on colour alone.
  const tab = (active: boolean) =>
    `relative min-h-11 shrink-0 px-0.5 text-[18px] transition-colors duration-150 ${
      active ? "font-semibold text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-ink" : "text-muted hover:text-ink"
    }`;

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div role="group" aria-label="Filter by type" className="-mx-4 flex gap-5 overflow-x-auto px-4 sm:mx-0 sm:gap-6 sm:px-0">
        <button type="button" aria-pressed={type === "all"} onClick={() => onType("all")} className={tab(type === "all")}>All</button>
        {CONTENT_TYPES.map((t) => (
          <button key={t} type="button" aria-pressed={type === t} onClick={() => onType(t)} className={tab(type === t)}>{TYPE_META[t].plural}</button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tags.length > 0 && (
          <Select aria-label="Filter by tag" value={tag ?? ""} onChange={(e) => onTag(e.target.value || null)} className="!min-h-10 !w-auto !rounded-full !border-transparent !bg-surface !py-1.5 text-sm">
            <option value="">All tags</option>
            {tags.map((t) => <option key={t} value={t}>#{t}</option>)}
          </Select>
        )}
        <SortMenu value={sort} onChange={onSort} />
        {filtered && <button type="button" onClick={onReset} className="min-h-10 rounded-full px-3 text-sm font-medium text-accent-strong hover:bg-surface">Clear</button>}
        <div role="group" aria-label="Layout" className="flex rounded-xl bg-surface p-0.5">
          {LAYOUTS.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" aria-pressed={layout === key} aria-label={label} title={label} onClick={() => onLayout(key)}
              className={`inline-flex size-9 items-center justify-center rounded-lg transition-colors duration-150 ${layout === key ? "bg-card text-ink shadow-[0_1px_2px_rgba(17,17,17,0.12)]" : "text-ink/60 hover:text-ink"}`}>
              <Icon size={17} aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
