import { TriangleAlert } from "lucide-react";
import type { ApiError } from "@/lib/api";
import { Button } from "./ui/Button";

const TITLES: Partial<Record<ApiError["code"], string>> = {
  not_configured: "Connect JSONBin to get started",
  auth_failed: "JSONBin rejected your API key",
  bin_not_found: "That bin couldn't be found",
  network: "Can't reach the server",
  invalid_data: "The saved data looks invalid",
  rate_limited: "JSONBin is rate limiting requests",
};

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-line bg-card p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-surface text-accent-strong">
          <TriangleAlert size={20} aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">{TITLES[error.code] ?? "Something went wrong"}</h2>
      </div>
      <p className="font-body text-base leading-relaxed text-muted">{error.message}</p>

      {error.code === "not_configured" && (
        <ol className="mt-5 list-decimal space-y-1.5 pl-5 font-body text-base text-ink">
          <li>Create a free account at jsonbin.io and a <strong>private</strong> bin containing <code className="rounded bg-surface px-1">{`{"version":1,"items":[],"collections":[]}`}</code>.</li>
          <li>Copy <code className="rounded bg-surface px-1">.env.example</code> to <code className="rounded bg-surface px-1">.env.local</code> and fill in <code className="rounded bg-surface px-1">JSONBIN_API_KEY</code> and <code className="rounded bg-surface px-1">JSONBIN_BIN_ID</code>.</li>
          <li>Restart <code className="rounded bg-surface px-1">npm run dev</code>, then try again. See README.md for details.</li>
        </ol>
      )}

      <div className="mt-6">
        <Button variant="primary" onClick={onRetry}>Try again</Button>
      </div>
    </div>
  );
}
