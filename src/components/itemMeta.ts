import type { SavedItem } from "@/lib/types";
import { domainOf } from "@/lib/view";

const TINTS = ["bg-tint-teal", "bg-tint-sand"] as const;

/** Stable pastel per item, so a tile keeps its colour across renders and devices. */
export function tintFor(item: SavedItem): string {
  if (item.type === "quote") return "bg-tint-slate";
  let h = 0;
  for (let i = 0; i < item.id.length; i++) h = (h * 31 + item.id.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length]!;
}

/** Quotes use the dark slate tile, so their text and controls flip to white. */
export const isDark = (item: SavedItem) => item.type === "quote";

export const isTinted = (item: SavedItem) => item.type === "text" || item.type === "quote";

const SHORT = { link: "Link", text: "Note", quote: "Quote", media: "Image", file: "Document" } as const;

/** Left side of a card footer: domain for web content, otherwise the type. */
export function footerLabel(item: SavedItem): string {
  if ((item.type === "link" || item.type === "media") && item.url) return domainOf(item.url) ?? SHORT[item.type];
  return SHORT[item.type];
}

export function primaryText(item: SavedItem): string {
  return item.title ?? item.filename ?? item.content?.replace(/\s+/g, " ").slice(0, 120) ?? domainOf(item.url) ?? SHORT[item.type];
}

export function secondaryText(item: SavedItem): string {
  if (item.type === "quote") return [item.author, item.source].filter(Boolean).join(" · ");
  if (item.type === "link" || item.type === "media") return [domainOf(item.url), item.description].filter(Boolean).join(" · ");
  if (item.type === "file") return [item.mimeType, item.description].filter(Boolean).join(" · ");
  return item.title ? (item.content?.replace(/\s+/g, " ").slice(0, 120) ?? "") : "";
}

export function fileExt(filename?: string): string {
  const m = filename?.match(/\.([A-Za-z0-9]{1,5})$/);
  return m ? m[1]!.toUpperCase() : "FILE";
}
