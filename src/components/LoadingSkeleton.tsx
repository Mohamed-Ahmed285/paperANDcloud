import { CardGrid } from "./MasonryGrid";

export function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your library…</span>
      <CardGrid>
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} role="presentation"><div className="pc-skeleton h-[272px] rounded-2xl border border-line" /></li>
        ))}
      </CardGrid>
    </div>
  );
}
