import "server-only";
import { AppError } from "./errors";
import type { CollectionInput, ItemInput } from "./schemas";
import { readLibrary, writeLibrary } from "./jsonbin";
import type { Collection, ContentType, Library, SavedItem } from "./types";

/**
 * Whole-dataset read-modify-write, serialised through an in-process queue.
 * This prevents overlapping requests handled by ONE server process from clobbering each other.
 * It is NOT a transaction: JSONBin has no locking/ETags, so two server instances (or two
 * deployments) writing at the same moment can still lose an update (last write wins).
 */
let queue: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (lib: Library) => T): Promise<T> {
  const run = queue.then(async () => {
    const lib = await readLibrary();
    const result = fn(lib);
    await writeLibrary(lib);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const getLibrary = readLibrary;

const FIELDS_BY_TYPE: Record<ContentType, ReadonlyArray<keyof ItemInput>> = {
  link: ["title", "url", "description"],
  text: ["title", "content"],
  quote: ["content", "author", "source"],
  media: ["title", "url", "description"],
  file: ["filename", "url", "description", "mimeType", "size"],
};

function contentFrom(input: ItemInput): Partial<SavedItem> {
  const out: Record<string, unknown> = {};
  for (const key of FIELDS_BY_TYPE[input.type]) {
    if (input[key] !== undefined) out[key] = input[key];
  }
  return out as Partial<SavedItem>;
}

function assertCollection(lib: Library, id: string | undefined) {
  if (id && !lib.collections.some((c) => c.id === id)) {
    throw new AppError("validation", 422, "That collection no longer exists.", { collectionId: "Choose an existing collection" });
  }
}

export function createItem(input: ItemInput): Promise<SavedItem> {
  return mutate((lib) => {
    assertCollection(lib, input.collectionId);
    const now = new Date().toISOString();
    const item: SavedItem = {
      id: crypto.randomUUID(),
      type: input.type,
      ...contentFrom(input),
      tags: input.tags,
      ...(input.collectionId ? { collectionId: input.collectionId } : {}),
      isFavorite: input.isFavorite ?? false,
      createdAt: now,
      updatedAt: now,
    };
    lib.items.unshift(item);
    return item;
  });
}

export function updateItem(id: string, input: ItemInput): Promise<SavedItem> {
  return mutate((lib) => {
    const idx = lib.items.findIndex((i) => i.id === id);
    const existing = lib.items[idx];
    if (!existing) throw new AppError("not_found", 404, "That item no longer exists.");
    assertCollection(lib, input.collectionId);
    const updated: SavedItem = {
      id: existing.id,
      type: input.type,
      ...contentFrom(input),
      tags: input.tags,
      ...(input.collectionId ? { collectionId: input.collectionId } : {}),
      isFavorite: input.isFavorite ?? existing.isFavorite,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    lib.items[idx] = updated;
    return updated;
  });
}

export function setFavorite(id: string, isFavorite: boolean): Promise<SavedItem> {
  return mutate((lib) => {
    const item = lib.items.find((i) => i.id === id);
    if (!item) throw new AppError("not_found", 404, "That item no longer exists.");
    item.isFavorite = isFavorite; // favoriting is not an edit: updatedAt is left alone
    return item;
  });
}

export function deleteItem(id: string): Promise<void> {
  return mutate((lib) => {
    const before = lib.items.length;
    lib.items = lib.items.filter((i) => i.id !== id);
    if (lib.items.length === before) throw new AppError("not_found", 404, "That item no longer exists.");
  });
}

function assertUniqueName(lib: Library, name: string, exceptId?: string) {
  const taken = lib.collections.some((c) => c.id !== exceptId && c.name.toLowerCase() === name.toLowerCase());
  if (taken) throw new AppError("conflict", 409, "You already have a collection with that name.", { name: "That name is already used" });
}

export function createCollection({ name }: CollectionInput): Promise<Collection> {
  return mutate((lib) => {
    assertUniqueName(lib, name);
    const now = new Date().toISOString();
    const collection: Collection = { id: crypto.randomUUID(), name, createdAt: now, updatedAt: now };
    lib.collections.push(collection);
    return collection;
  });
}

export function renameCollection(id: string, { name }: CollectionInput): Promise<Collection> {
  return mutate((lib) => {
    const c = lib.collections.find((x) => x.id === id);
    if (!c) throw new AppError("not_found", 404, "That collection no longer exists.");
    assertUniqueName(lib, name, id);
    c.name = name;
    c.updatedAt = new Date().toISOString();
    return c;
  });
}

/** Deleting a collection never deletes its items; they simply become uncategorised. */
export function deleteCollection(id: string): Promise<void> {
  return mutate((lib) => {
    if (!lib.collections.some((c) => c.id === id)) throw new AppError("not_found", 404, "That collection no longer exists.");
    lib.collections = lib.collections.filter((c) => c.id !== id);
    for (const item of lib.items) if (item.collectionId === id) delete item.collectionId;
  });
}
