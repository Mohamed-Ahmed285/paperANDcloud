import { z } from "zod";
import { CONTENT_TYPES } from "./types";

/** Shared by the browser (inline validation) and the server (authoritative validation). */
export const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.replace(/^#+/, "").replace(/\s+/g, " ").trim().toLowerCase();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

const blankToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const text = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max, `Keep this under ${max} characters`).optional());

const url = z.preprocess(
  blankToUndefined,
  z.string().trim().max(2048, "URL is too long").refine(isHttpUrl, "Enter a valid http(s) URL").optional(),
);

export const ItemInputSchema = z
  .object({
    type: z.enum(CONTENT_TYPES),
    title: text(200),
    content: text(20000),
    url,
    description: text(2000),
    author: text(200),
    source: text(300),
    filename: text(260),
    mimeType: text(120),
    size: z.number().int().nonnegative().max(1e12).optional(),
    tags: z
      .array(z.string().max(60))
      .max(20, "Use at most 20 tags")
      .default([])
      .transform(normalizeTags),
    collectionId: z.string().regex(ID_RE).nullish().transform((v) => v ?? undefined),
    isFavorite: z.boolean().optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    const need = (field: string, ok: unknown, message: string) => {
      if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
    };
    switch (v.type) {
      case "link":
        need("url", v.url, "A URL is required");
        break;
      case "text":
        need("content", v.content, "Some text is required");
        break;
      case "quote":
        need("content", v.content, "The quote text is required");
        break;
      case "media":
        need("url", v.url, "An image or media URL is required");
        break;
      case "file":
        need("filename", v.filename, "A filename is required");
        break;
    }
  });

export type ItemInput = z.output<typeof ItemInputSchema>;
export type ItemInputRaw = z.input<typeof ItemInputSchema>;

export const FavoritePatchSchema = z.object({ isFavorite: z.boolean() }).strict();

export const CollectionInputSchema = z
  .object({ name: z.string().trim().min(1, "Give the collection a name").max(60, "Keep it under 60 characters") })
  .strict();
export type CollectionInput = z.output<typeof CollectionInputSchema>;

export const IdSchema = z.string().regex(ID_RE, "Invalid id");
