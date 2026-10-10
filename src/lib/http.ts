import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import { AppError } from "./errors";
import { IdSchema } from "./schemas";
import type { ApiErrorBody } from "./types";

const MAX_BODY_BYTES = 64 * 1024;

export async function readJson(req: Request): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) throw new AppError("payload_too_large", 413, "That request is too large.");
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) throw new AppError("payload_too_large", 413, "That request is too large.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError("validation", 400, "The request body must be valid JSON.");
  }
}

function fieldsFrom(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in fields)) fields[key] = issue.code === "unrecognized_keys" ? "Unexpected field" : issue.message;
  }
  return fields;
}

export function parseBody<S extends z.ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError("validation", 422, "Please fix the highlighted fields.", fieldsFrom(result.error));
  }
  return result.data;
}

export function parseId(id: string): string {
  const r = IdSchema.safeParse(id);
  if (!r.success) throw new AppError("validation", 400, "Invalid id.");
  return r.data;
}

export function ok(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function errorResponse(e: unknown) {
  const err =
    e instanceof AppError
      ? e
      : new AppError("server_error", 500, "Something went wrong on the server.", undefined, e instanceof Error ? e.message : "unknown");
  // Log diagnostics only (code + internal note). Never log headers, keys, or upstream bodies.
  if (err.status >= 500 || err.code === "auth_failed") {
    console.error(`[api] ${err.code}${err.internal ? ` — ${err.internal}` : ""}`);
  }
  const body: ApiErrorBody = { error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) } };
  return NextResponse.json(body, { status: err.status, headers: { "Cache-Control": "no-store" } });
}

export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    return errorResponse(e);
  }
}
