import { X } from "lucide-react";

const base = "inline-flex max-w-full items-center gap-1 rounded-full border border-transparent bg-surface px-2.5 py-1 text-xs font-medium text-accent-strong";

export function TagBadge({ tag, onClick, onRemove, active }: { tag: string; onClick?: () => void; onRemove?: () => void; active?: boolean }) {
  if (onRemove) {
    return (
      <span className={base}>
        <span className="truncate">{tag}</span>
        <button type="button" onClick={onRemove} aria-label={`Remove tag ${tag}`} className="-mr-1 rounded-full p-0.5 hover:bg-white">
          <X size={12} aria-hidden />
        </button>
      </span>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        title={`Filter by ${tag}`}
        className={`${base} transition-colors duration-150 hover:border-line ${active ? "border-accent" : ""}`}
      >
        <span className="truncate">#{tag}</span>
      </button>
    );
  }
  return <span className={base}>#{tag}</span>;
}
