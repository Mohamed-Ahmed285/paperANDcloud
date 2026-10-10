"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Masonry via CSS grid row-spans. Unlike CSS `columns`, the DOM order IS the reading order
 * (left-to-right, top-to-bottom), so keyboard tab order matches what you see.
 * Each cell measures its card and spans enough 8px rows to fit it.
 * Column count comes from container queries, so it adapts to the space beside the sidebar.
 */
const ROW = 8;
const GAP = 20;

export function MasonryGrid({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="@container">
      <div
        role="list"
        aria-label={label}
        className="grid auto-rows-[8px] grid-cols-1 gap-x-5 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4"
      >
        {children}
      </div>
    </div>
  );
}

export function MasonryCell({ children }: { children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [span, setSpan] = useState(24);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => setSpan(Math.max(1, Math.ceil((el.offsetHeight + GAP) / ROW)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div role="listitem" style={{ gridRowEnd: `span ${span}` }} className="min-w-0">
      <div ref={inner}>{children}</div>
    </div>
  );
}

export function SkeletonCell({ height }: { height: number }) {
  return (
    <div
      role="presentation"
      style={{ gridRowEnd: `span ${Math.ceil((height + GAP) / ROW)}` }}
      className="min-w-0"
    >
      <div style={{ height }} className="pc-skeleton rounded-2xl border border-line" />
    </div>
  );
}
