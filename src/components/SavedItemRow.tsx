"use client";

import { formatDate } from "@/lib/view";
import { ItemActions, type ItemHandlers } from "./ItemActions";
import { LinkPreview } from "./LinkPreview";
import { TagBadge } from "./TagBadge";
import { isDark, isTinted, primaryText, secondaryText, tintFor } from "./itemMeta";
import { TYPE_META } from "./typeMeta";
import type { SavedItem } from "@/lib/types";

export function SavedItemRow({ item, onTagClick, activeTag, ...handlers }: ItemHandlers & { item: SavedItem; onTagClick: (t: string) => void; activeTag?: string | null }) {
  const Icon = TYPE_META[item.type].icon;
  const second = secondaryText(item);
  return (
    <article className="group flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 transition-colors duration-150 hover:border-accent/40 focus-within:border-accent/40">
      {item.type === "link" && item.url ? (
        <LinkPreview
          url={item.url}
          title={item.title}
          compact
          className="size-10 shrink-0 overflow-hidden rounded-lg"
          fallback={
            <span aria-hidden className={`flex size-full items-center justify-center ${isDark(item) ? "text-white" : "text-ink/70"} ${isTinted(item) ? tintFor(item) : "bg-surface"}`}>
              <Icon size={18} />
            </span>
          }
        />
      ) : (
        <span aria-hidden className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${isDark(item) ? "text-white" : "text-ink/70"} ${isTinted(item) ? tintFor(item) : "bg-surface"}`}><Icon size={18} /></span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{item.type === "quote" ? `“${primaryText(item)}”` : primaryText(item)}</p>
        {second && <p className="truncate text-sm text-muted">{second}</p>}
      </div>
      <ul className="hidden max-w-[40%] gap-1.5 overflow-hidden md:flex" aria-label="Tags">
        {item.tags.slice(0, 3).map((t) => <li key={t}><TagBadge tag={t} onClick={() => onTagClick(t)} active={activeTag === t} /></li>)}
      </ul>
      <time dateTime={item.createdAt} className="hidden shrink-0 text-sm text-muted sm:block">{formatDate(item.createdAt)}</time>
      <ItemActions item={item} {...handlers} />
    </article>
  );
}
