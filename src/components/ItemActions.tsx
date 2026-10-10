"use client";

import { Check, Copy, Download, ExternalLink, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import type { SavedItem } from "@/lib/types";
import { Menu, MenuItem } from "./ui/Menu";
import { isDark, primaryText } from "./itemMeta";

const light = "text-muted hover:bg-black/5 hover:text-ink";
const darkTone = "text-white/80 hover:bg-white/15 hover:text-white";

export interface ItemHandlers {
  onToggleFavorite: (item: SavedItem) => void;
  onEdit: (item: SavedItem) => void;
  onDelete: (item: SavedItem) => void;
}

export function ItemActions({ item, onToggleFavorite, onEdit, onDelete }: { item: SavedItem } & ItemHandlers) {
  const btn = `inline-flex size-9 items-center justify-center rounded-lg transition-colors duration-150 ${isDark(item) ? darkTone : light}`;
  const [copied, setCopied] = useState(false);
  const copyText = item.type === "quote" && item.content ? `${item.content}${item.author ? ` — ${item.author}` : ""}` : item.content;
  const canCopy = (item.type === "text" || item.type === "quote") && !!copyText;
  const link = item.url && item.type !== "quote" && item.type !== "text" ? item.url : undefined;
  const linkLabel = item.type === "file" ? "Download or open file" : item.type === "media" ? "Open original" : "Open link";

  return (
    <div className="flex items-center">
      {canCopy && (
        <button
          type="button"
          className={`${btn} pc-reveal`}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(copyText!);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard unavailable; ignore */
            }
          }}
        >
          {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        </button>
      )}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`${linkLabel} (opens in a new tab)`} className={`${btn} pc-reveal`}>
          {item.type === "file" ? <Download size={16} aria-hidden /> : <ExternalLink size={16} aria-hidden />}
        </a>
      )}
      <button
        type="button"
        onClick={() => onToggleFavorite(item)}
        aria-pressed={item.isFavorite}
        aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={`${btn} ${item.isFavorite ? "!text-current" : "pc-reveal"}`}
      >
        <Star size={16} aria-hidden fill={item.isFavorite ? "currentColor" : "none"} />
      </button>
      <Menu label={`More actions for ${primaryText(item)}`} trigger={<MoreHorizontal size={16} aria-hidden />} triggerClassName={`${btn} pc-reveal`}>
        {(close) => (
          <>
            <MenuItem icon={<Pencil size={15} aria-hidden />} onClick={() => { close(); onEdit(item); }}>Edit</MenuItem>
            <MenuItem danger icon={<Trash2 size={15} aria-hidden />} onClick={() => { close(); onDelete(item); }}>Delete</MenuItem>
          </>
        )}
      </Menu>
    </div>
  );
}
