import { CONTENT_TYPES, type ContentType, type SortKey } from "@/lib/types";
import { SortMenu } from "./SortMenu";
import { TYPE_META } from "./typeMeta";
import { Select } from "./ui/Field";

export function FilterBar({
  type,
  onType,
  tag,
  tags,
  onTag,
  sort,
  onSort,
  onReset,
  filtered,
}: {
  type: ContentType | "all";
  onType: (t: ContentType | "all") => void;
  tag: string | null;
  tags: string[];
  onTag: (t: string | null) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onReset: () => void;
  filtered: boolean;
}) {
  const pill = (active: boolean) =>
    `inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 text-sm transition-colors duration-150 ${active ? "border-accent bg-surface font-medium text-accent-strong" : "border-line bg-card text-ink hover:bg-surface"}`;

  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label="Filter by type" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
        <button type="button" aria-pressed={type === "all"} onClick={() => onType("all")} className={pill(type === "all")}>All</button>
        {CONTENT_TYPES.map((t) => (
          <button key={t} type="button" aria-pressed={type === t} onClick={() => onType(t)} className={pill(type === t)}>{TYPE_META[t].plural}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.length > 0 && (
          <Select aria-label="Filter by tag" value={tag ?? ""} onChange={(e) => onTag(e.target.value || null)} className="!min-h-10 !w-auto !py-1.5 text-sm">
            <option value="">All tags</option>
            {tags.map((t) => <option key={t} value={t}>#{t}</option>)}
          </Select>
        )}
        <SortMenu value={sort} onChange={onSort} />
        {filtered && (
          <button type="button" onClick={onReset} className="min-h-10 rounded-xl px-3 text-sm font-medium text-accent-strong hover:bg-surface">Clear filters</button>
        )}
      </div>
    </div>
  );
}
