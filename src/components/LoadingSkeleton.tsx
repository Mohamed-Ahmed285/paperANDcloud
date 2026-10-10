import { MasonryGrid, SkeletonCell } from "./MasonryGrid";

const HEIGHTS = [180, 260, 150, 220, 300, 170, 240, 190];

export function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your library…</span>
      <MasonryGrid>
        {HEIGHTS.map((h, i) => (
          <SkeletonCell key={i} height={h} />
        ))}
      </MasonryGrid>
    </div>
  );
}
