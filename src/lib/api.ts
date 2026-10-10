import type { CollectionInput, ItemInput } from "./schemas";
import type { ApiErrorBody, Collection, ErrorCode, Library, SavedItem } from "./types";

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(e: unknown): ApiError {
  return e instanceof ApiError ? e : new ApiError("server_error", "Something unexpected went wrong.");
}

async function call<T>(path: string, init?: { method: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("network", "Can't reach the app server. Check your connection and try again.");
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as Partial<ApiErrorBody> | null)?.error;
    throw new ApiError(err?.code ?? "server_error", err?.message ?? "Something went wrong.", err?.fields);
  }
  return data as T;
}

export const api = {
  library: () => call<Library>("/api/library"),
  createItem: (input: ItemInput) => call<{ item: SavedItem }>("/api/items", { method: "POST", body: input }),
  updateItem: (id: string, input: ItemInput) => call<{ item: SavedItem }>(`/api/items/${id}`, { method: "PATCH", body: input }),
  setFavorite: (id: string, isFavorite: boolean) =>
    call<{ item: SavedItem }>(`/api/items/${id}`, { method: "PATCH", body: { isFavorite } }),
  deleteItem: (id: string) => call<{ id: string }>(`/api/items/${id}`, { method: "DELETE" }),
  createCollection: (input: CollectionInput) => call<{ collection: Collection }>("/api/collections", { method: "POST", body: input }),
  renameCollection: (id: string, input: CollectionInput) =>
    call<{ collection: Collection }>(`/api/collections/${id}`, { method: "PATCH", body: input }),
  deleteCollection: (id: string) => call<{ id: string }>(`/api/collections/${id}`, { method: "DELETE" }),
};
