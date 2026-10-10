"use client";

import { ImageOff, Link2 } from "lucide-react";
import { useState } from "react";
import type { SavedItem } from "@/lib/types";
import { domainOf, formatBytes } from "@/lib/view";
import { ItemActions, type ItemHandlers } from "./ItemActions";
import { LinkPreview } from "./LinkPreview";
import { TagBadge } from "./TagBadge";
import { fileExt, footerLabel, isDark, isTinted, tintFor } from "./itemMeta";
import { TYPE_META } from "./typeMeta";

export type CardLayout = "grid" | "masonry";

interface Props extends ItemHandlers {
  item: SavedItem;
  collectionName?: string;
  layout: CardLayout;
  onTagClick: (tag: string) => void;
  activeTag?: string | null;
}

// Written out in full so Tailwind can detect the classes (it cannot see interpolated names).
const CLAMPS: Record<2 | 4 | 5 | 6, string> = {
  2: "line-clamp-2",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};
const VIDEO_RE = /\.(mp4|webm|ogg|mov)(\?|#|$)/i;

function MediaPreview({ item, fixed }: { item: SavedItem; fixed: boolean }) {
  const [failed, setFailed] = useState(false);
  const url = item.url!;
  const size = fixed
    ? "h-full w-full object-contain "
    : "max-h-80 w-full object-cover";
  if (VIDEO_RE.test(url))
    return (
      <video
        src={url}
        controls
        preload="metadata"
        aria-label={item.title ?? "Saved video"}
        className={size}
      />
    );
  if (failed) {
    return (
      <div className="flex h-full min-h-28 flex-col items-center justify-center gap-1 px-4 py-6 text-center text-muted">
        <ImageOff size={22} aria-hidden />
        <p className="text-sm">Preview unavailable</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-ink underline underline-offset-2"
        >
          Open original
        </a>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts; next/image would need an allow-list
    <img
      src={url}
      alt={item.title ?? item.description ?? "Saved image"}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={size}
    />
  );
}

export function SavedItemCard({
  item,
  collectionName,
  layout,
  onToggleFavorite,
  onEdit,
  onDelete,
  onTagClick,
  activeTag,
}: Props) {
  const fixed = layout === "grid";
  const tinted = isTinted(item);
  const dark = isDark(item);
  const domain = domainOf(item.url);
  const Icon = TYPE_META[item.type].icon;
  const clamp = (n: 2 | 4 | 5 | 6) => (fixed ? CLAMPS[n] : "");
  const tags = fixed ? item.tags.slice(0, 2) : item.tags;
  const extra = item.tags.length - tags.length;
  const sub = dark ? "text-white/75" : tinted ? "text-ink/70" : "text-muted";
  const panel = `flex shrink-0 items-center justify-center overflow-hidden rounded-t-[22px] bg-surface ${fixed ? "h-48" : "h-48"}`;

  return (
    <article
      aria-label={item.title ?? item.filename ?? footerLabel(item)}
      className={`group relative flex h-full flex-col rounded-[22px] border transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:z-10 hover:shadow-[0_2px_14px_rgba(17,17,17,0.08)] focus-within:z-10 ${
        tinted
          ? `${tintFor(item)} border-transparent ${dark ? "text-white" : "text-ink"}`
          : "border-line bg-card text-ink hover:border-ink/25"
      } ${fixed ? "min-h-[272px]" : ""}`}
    >
      {item.type === "media" && item.url && (
        <div
          className={`${fixed ? panel : "overflow-hidden rounded-t-[22px] bg-surface"}`}
        >
          <MediaPreview item={item} fixed={fixed} />
        </div>
      )}
      {item.type === "file" && (
        <div className={panel}>
          <span className="flex h-[88px] w-[68px] items-end justify-center rounded-md border border-line bg-card pb-2 text-base font-bold tracking-wide shadow-[0_1px_0_rgba(17,17,17,0.06)]">
            {fileExt(item.filename)}
          </span>
        </div>
      )}
      {item.type === "link" && (
        <LinkPreview
          url={item.url!}
          title={item.title}
          className={`${panel} flex-col gap-2 text-muted`}
          fallback={
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <Link2 size={26} aria-hidden />
              <span className="max-w-[85%] truncate text-base font-semibold text-ink/80">
                {domain ?? item.url}
              </span>
            </div>
          }
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col p-5 pb-3">
        {tinted && (
          <Icon size={22} aria-hidden className="mb-3 shrink-0 opacity-80" />
        )}

        {item.type === "quote" ? (
          <figure className="min-h-0">
            <blockquote
              className={`break-words font-serif text-xl leading-snug ${clamp(5)}`}
            >
              “{item.content}”
            </blockquote>
            {(item.author || item.source) && (
              <figcaption className={`mt-2 truncate text-[15px] ${sub}`}>
                {item.author && (
                  <span className="font-semibold text-white">
                    {item.author}
                  </span>
                )}
                {item.author && item.source && " · "}
                {item.source}
              </figcaption>
            )}
          </figure>
        ) : item.type === "text" ? (
          <div className="min-h-0 text-[19px] leading-snug">
            {item.title && (
              <h3 className={`break-words font-bold ${clamp(2)}`}>
                {item.title}
              </h3>
            )}
            {item.content && (
              <p
                className={`whitespace-pre-wrap break-words ${item.title ? "mt-1" : ""} ${clamp(item.title ? 4 : 6)}`}
              >
                {item.content}
              </p>
            )}
          </div>
        ) : (
          <>
            {(item.title || item.filename) && (
              <h3
                className={`break-words text-[18px] font-semibold leading-snug ${clamp(2)}`}
              >
                {item.type === "link" && item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:underline-offset-2"
                  >
                    {item.title ?? item.url}
                  </a>
                ) : item.type === "file" ? (
                  item.filename
                ) : (
                  item.title
                )}
              </h3>
            )}
            {item.type === "file" &&
              (item.mimeType || item.size !== undefined) && (
                <p className="mt-0.5 text-sm text-muted">
                  {[item.mimeType, formatBytes(item.size)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            {!fixed && item.description && (
              <p className="mt-1.5 break-words text-[16px] leading-relaxed text-muted">
                {item.description}
              </p>
            )}
          </>
        )}

        {tags.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Tags">
            {tags.map((t) => (
              <li key={t} className="max-w-full">
                <TagBadge
                  tag={t}
                  onClick={() => onTagClick(t)}
                  active={activeTag === t}
                />
              </li>
            ))}
            {extra > 0 && (
              <li className={`self-center text-xs ${sub}`}>+{extra}</li>
            )}
          </ul>
        )}

        <footer className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span
            className={`flex min-w-0 items-center gap-2 text-[15px] ${sub}`}
          >
            {item.type === "link" && (
              <span
                aria-hidden
                className="flex size-5 shrink-0 items-center justify-center rounded bg-ink text-[11px] font-bold uppercase text-bg"
              >
                {(domain ?? "?")[0]}
              </span>
            )}
            <span className="truncate">
              {footerLabel(item)}
              {collectionName && (
                <span className="opacity-70"> • {collectionName}</span>
              )}
            </span>
          </span>
          <div className="-mr-2 shrink-0">
            <ItemActions
              item={item}
              onToggleFavorite={onToggleFavorite}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </footer>
      </div>
    </article>
  );
}
