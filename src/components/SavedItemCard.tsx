"use client";

import { Check, Copy, Download, ExternalLink, FolderOpen, ImageOff, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import type { SavedItem } from "@/lib/types";
import { domainOf, formatBytes, formatDate } from "@/lib/view";
import { TagBadge } from "./TagBadge";
import { Menu, MenuItem } from "./ui/Menu";
import { TYPE_META } from "./typeMeta";

interface Props {
  item: SavedItem;
  collectionName?: string;
  onToggleFavorite: (item: SavedItem) => void;
  onEdit: (item: SavedItem) => void;
  onDelete: (item: SavedItem) => void;
  onTagClick: (tag: string) => void;
  activeTag?: string | null;
}

const reveal = "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity duration-150";
const iconBtn = "inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-surface hover:text-ink";
const VIDEO_RE = /\.(mp4|webm|ogg|mov)(\?|#|$)/i;

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`${iconBtn} ${reveal}`}
      aria-label={done ? "Copied" : "Copy to clipboard"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable (insecure context / denied); nothing to do */
        }
      }}
    >
      {done ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
    </button>
  );
}

function OpenLink({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`} className={`${iconBtn} ${reveal}`}>
      {label.startsWith("Download") ? <Download size={16} aria-hidden /> : <ExternalLink size={16} aria-hidden />}
    </a>
  );
}

function MediaPreview({ item }: { item: SavedItem }) {
  const [failed, setFailed] = useState(false);
  const url = item.url!;
  if (VIDEO_RE.test(url)) {
    return <video src={url} controls preload="metadata" className="max-h-96 w-full rounded-xl bg-surface" aria-label={item.title ?? "Saved video"} />;
  }
  if (failed) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-surface px-4 py-8 text-center text-muted">
        <ImageOff size={22} aria-hidden />
        <p className="text-sm">Preview unavailable</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent-strong underline underline-offset-2">Open original</a>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote hosts; next/image would need an allow-list
    <img src={url} alt={item.title ?? item.description ?? "Saved image"} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="max-h-96 w-full rounded-xl bg-surface object-cover" />
  );
}

export function SavedItemCard({ item, collectionName, onToggleFavorite, onEdit, onDelete, onTagClick, activeTag }: Props) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const domain = domainOf(item.url);
  const edited = item.updatedAt !== item.createdAt;
  const copyText = item.type === "quote" && item.content ? `${item.content}${item.author ? ` — ${item.author}` : ""}` : item.content;

  return (
    <article
      aria-label={item.title ?? item.filename ?? meta.label}
      className="group relative rounded-2xl hover:z-10 focus-within:z-10 border border-line bg-card p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-accent/40 hover:shadow-[0_2px_10px_rgba(23,43,77,0.06)] focus-within:border-accent/40"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <Icon size={14} aria-hidden /> {meta.label}
        </span>
        <div className="-mr-1.5 -mt-1.5 flex items-center">
          <button
            type="button"
            onClick={() => onToggleFavorite(item)}
            aria-pressed={item.isFavorite}
            aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={`${iconBtn} ${item.isFavorite ? "text-accent-strong" : ""}`}
          >
            <Star size={17} aria-hidden fill={item.isFavorite ? "currentColor" : "none"} />
          </button>
          <Menu label={`More actions for ${item.title ?? item.filename ?? meta.label}`} trigger={<MoreHorizontal size={17} aria-hidden />} triggerClassName={iconBtn}>
            {(close) => (
              <>
                <MenuItem icon={<Pencil size={15} aria-hidden />} onClick={() => { close(); onEdit(item); }}>Edit</MenuItem>
                <MenuItem danger icon={<Trash2 size={15} aria-hidden />} onClick={() => { close(); onDelete(item); }}>Delete</MenuItem>
              </>
            )}
          </Menu>
        </div>
      </header>

      {item.type === "media" && item.url && <div className="mb-3"><MediaPreview item={item} /></div>}

      {item.type === "quote" ? (
        <figure>
          <blockquote className="break-words font-serif text-[19px] leading-relaxed">“{item.content}”</blockquote>
          {(item.author || item.source) && (
            <figcaption className="mt-3 font-body text-[15px] text-muted">
              {item.author && <span className="font-semibold text-ink">{item.author}</span>}
              {item.author && item.source && " · "}
              {item.source}
            </figcaption>
          )}
        </figure>
      ) : (
        <>
          {(item.title || (item.type === "file" && item.filename)) && (
            <h3 className="break-words text-base font-semibold leading-snug">
              {item.type === "link" && item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent-strong">{item.title}</a>
              ) : (
                item.type === "file" ? item.filename : item.title
              )}
            </h3>
          )}
          {item.type === "text" && item.content && (
            <p className={`whitespace-pre-wrap break-words font-body text-base leading-relaxed text-ink/90 ${item.title ? "mt-2" : ""}`}>{item.content}</p>
          )}
          {item.type === "link" && (
            <p className="mt-1 truncate text-sm text-muted">{domain ?? item.url}</p>
          )}
          {item.type === "file" && (
            <p className="mt-1 text-sm text-muted">
              {[item.mimeType, formatBytes(item.size)].filter(Boolean).join(" · ") || domain}
            </p>
          )}
          {item.description && <p className="mt-2 break-words font-body text-[15px] leading-relaxed text-muted">{item.description}</p>}
          {item.type === "media" && item.url && !item.title && domain && <p className="truncate text-sm text-muted">{domain}</p>}
        </>
      )}

      {item.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {item.tags.map((t) => (
            <li key={t} className="max-w-full"><TagBadge tag={t} onClick={() => onTagClick(t)} active={activeTag === t} /></li>
          ))}
        </ul>
      )}

      <footer className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
          <time dateTime={item.updatedAt} className="shrink-0">{edited ? "Updated " : ""}{formatDate(edited ? item.updatedAt : item.createdAt)}</time>
          {collectionName && (
            <span className="inline-flex min-w-0 items-center gap-1"><FolderOpen size={12} aria-hidden className="shrink-0" /><span className="truncate">{collectionName}</span></span>
          )}
        </div>
        <div className="-mr-1.5 flex shrink-0 items-center">
          {copyText && (item.type === "text" || item.type === "quote") && <CopyButton text={copyText} />}
          {item.url && item.type === "link" && <OpenLink url={item.url} label="Open link" />}
          {item.url && item.type === "media" && <OpenLink url={item.url} label="Open original" />}
          {item.url && item.type === "file" && <OpenLink url={item.url} label="Download or open file" />}
        </div>
      </footer>
    </article>
  );
}
