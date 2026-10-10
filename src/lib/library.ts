import { CONTENT_TYPES, type Collection, type ContentType, type Library, type SavedItem } from "./types";
import { AppError } from "./errors";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);

function normalizeItem(raw: unknown, now: string): SavedItem | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.id);
  const type = raw.type as ContentType;
  if (!id || !CONTENT_TYPES.includes(type)) return null;
  const item: SavedItem = {
    id,
    type,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [],
    isFavorite: raw.isFavorite === true,
    createdAt: str(raw.createdAt) ?? now,
    updatedAt: str(raw.updatedAt) ?? str(raw.createdAt) ?? now,
  };
  for (const key of ["title", "content", "url", "description", "author", "source", "filename", "mimeType", "collectionId"] as const) {
    const v = str(raw[key]);
    if (v !== undefined) item[key] = v;
  }
  if (typeof raw.size === "number" && Number.isFinite(raw.size)) item.size = raw.size;
  return item;
}

function normalizeCollection(raw: unknown, now: string): Collection | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.id);
  const name = str(raw.name);
  if (!id || !name) return null;
  return { id, name, createdAt: str(raw.createdAt) ?? now, updatedAt: str(raw.updatedAt) ?? now };
}

/**
 * Turns whatever is stored in the bin into a valid Library.
 * Tolerates a freshly created bin (e.g. `{}` or JSONBin's sample record), missing
 * optional fields, and unknown or malformed records (which are skipped).
 */
export function normalizeLibrary(raw: unknown): Library {
  if (!isRecord(raw)) {
    throw new AppError("invalid_data", 502, "The stored data isn't a JSON object. Check the bin contents.");
  }
  const now = new Date().toISOString();
  const collections = (Array.isArray(raw.collections) ? raw.collections : [])
    .map((c) => normalizeCollection(c, now))
    .filter((c): c is Collection => c !== null);
  const ids = new Set(collections.map((c) => c.id));
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .map((i) => normalizeItem(i, now))
    .filter((i): i is SavedItem => i !== null)
    .map((i) => (i.collectionId && !ids.has(i.collectionId) ? { ...i, collectionId: undefined } : i));
  return { version: 1, items, collections };
}
