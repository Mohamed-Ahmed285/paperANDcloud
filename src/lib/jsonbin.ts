import "server-only";
import { AppError } from "./errors";
import { normalizeLibrary } from "./library";
import type { Library } from "./types";

// Verified against https://jsonbin.io/api-reference (bins/read, bins/update):
//   base URL      https://api.jsonbin.io/v3
//   read latest   GET  /b/<BIN_ID>/latest   -> { record, metadata }
//   update        PUT  /b/<BIN_ID>           (JSON body replaces the whole record)
//   auth          X-Master-Key  or  X-Access-Key (scoped; needs Bins Read + Bins Update)
// NOTE: `/latest` is the documented "read latest version" operation; if JSONBin changes
// its paths, this file is the only place that needs to change.
const BASE = "https://api.jsonbin.io/v3";
const TIMEOUT_MS = 10_000;

interface Config {
  binId: string;
  headers: Record<string, string>;
}

function getConfig(): Config {
  const binId = process.env.JSONBIN_BIN_ID?.trim();
  const master = process.env.JSONBIN_API_KEY?.trim();
  const access = process.env.JSONBIN_ACCESS_KEY?.trim();
  const placeholder = (v?: string) => !v || v.startsWith("your_");
  const hasKey = !placeholder(access) || !placeholder(master);

  if (placeholder(binId) || !hasKey) {
    throw new AppError(
      "not_configured",
      503,
      "JSONBin isn't configured yet. Add JSONBIN_API_KEY and JSONBIN_BIN_ID to .env.local and restart the server.",
    );
  }
  if (!/^[A-Za-z0-9]{10,40}$/.test(binId!)) {
    throw new AppError("not_configured", 503, "JSONBIN_BIN_ID doesn't look like a valid bin ID.");
  }
  const key = !placeholder(access) ? access! : master!;
  // JSONBin keys look like "$2a$10$…" (60 chars). Next.js expands "$…" in .env files as variable
  // references, silently mangling an unescaped key. Detect that and say so, instead of a vague 401.
  if (!key.startsWith("$2")) {
    throw new AppError(
      "not_configured",
      503,
      "The JSONBin key in .env.local looks mangled (JSONBin keys start with \"$2a$\"). Each $ must be written as \\$ in .env.local, e.g. JSONBIN_API_KEY=\\$2a\\$10\\$…, then restart the server.",
      undefined,
      "key does not start with $2 (likely $-expansion in .env)",
    );
  }
  const headers = !placeholder(access) ? { "X-Access-Key": key } : { "X-Master-Key": key };
  return { binId: binId!, headers };
}

async function request(method: "GET" | "PUT", path: string, body?: unknown): Promise<unknown> {
  const { headers } = getConfig();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { ...headers, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctl.signal,
      cache: "no-store",
    });
  } catch (e) {
    const reason = e instanceof Error ? e.name : "unknown";
    throw new AppError("network", 502, "Couldn't reach JSONBin. Check your internet connection and try again.", undefined, `fetch failed: ${reason}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const internal = `JSONBin ${method} responded ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      throw new AppError("auth_failed", 502, "JSONBin rejected the API key. Check JSONBIN_API_KEY (or the access key's permissions).", undefined, internal);
    }
    if (res.status === 404) {
      throw new AppError("bin_not_found", 502, "JSONBin couldn't find that bin. Check JSONBIN_BIN_ID and that it belongs to this key's account.", undefined, internal);
    }
    if (res.status === 429) {
      throw new AppError("rate_limited", 429, "JSONBin's request limit was reached. Wait a bit and try again.", undefined, internal);
    }
    throw new AppError("upstream_error", 502, "JSONBin returned an unexpected error. Try again shortly.", undefined, internal);
  }
  try {
    return await res.json();
  } catch {
    throw new AppError("invalid_data", 502, "JSONBin returned a response that couldn't be read.");
  }
}

export async function readLibrary(): Promise<Library> {
  const { binId } = getConfig();
  const json = await request("GET", `/b/${binId}/latest`);
  const record = typeof json === "object" && json !== null ? (json as { record?: unknown }).record : undefined;
  return normalizeLibrary(record);
}

export async function writeLibrary(library: Library): Promise<void> {
  const { binId } = getConfig();
  await request("PUT", `/b/${binId}`, library);
}
