export const CONTENT_TYPES = ["link", "text", "quote", "media", "file"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export interface SavedItem {
  id: string;
  type: ContentType;
  title?: string;
  content?: string;
  url?: string;
  description?: string;
  author?: string;
  source?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  tags: string[];
  collectionId?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** The single JSON document stored in the JSONBin bin. */
export interface Library {
  version: 1;
  items: SavedItem[];
  collections: Collection[];
}

export type ErrorCode =
  | "not_configured"
  | "auth_failed"
  | "bin_not_found"
  | "network"
  | "rate_limited"
  | "invalid_data"
  | "validation"
  | "not_found"
  | "conflict"
  | "payload_too_large"
  | "upstream_error"
  | "server_error";

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; fields?: Record<string, string> };
}

export type SortKey = "newest" | "oldest" | "updated" | "alpha";
export type Scope =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "collection"; id: string };
