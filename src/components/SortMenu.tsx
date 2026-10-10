import { ArrowUpDown } from "lucide-react";
import type { SortKey } from "@/lib/types";
import { Menu, MenuItem } from "./ui/Menu";

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  updated: "Recently updated",
  alpha: "Alphabetical",
};

export function SortMenu({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <Menu
      label={`Sort: ${SORT_LABELS[value]}`}
      trigger={<><ArrowUpDown size={15} aria-hidden /> <span className="hidden sm:inline">{SORT_LABELS[value]}</span><span className="sm:hidden">Sort</span></>}
      triggerClassName="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-card px-3.5 text-sm transition-colors duration-150 hover:bg-surface"
    >
      {(close) => (Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
        <MenuItem key={k} selected={k === value} onClick={() => { onChange(k); close(); }}>{SORT_LABELS[k]}</MenuItem>
      ))}
    </Menu>
  );
}
