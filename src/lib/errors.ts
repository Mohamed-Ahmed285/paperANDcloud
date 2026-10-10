import type { ErrorCode } from "./types";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly fields?: Record<string, string>,
    /** Diagnostic detail for server logs only. Never sent to the client. */
    public readonly internal?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
