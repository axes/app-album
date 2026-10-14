import type { ReactNode } from "react";

/**
 * UI-06A — loading placeholders.
 *
 * `Skeleton` is a decorative, token-driven block and `LoadingRegion` is the
 * accessible wrapper that owns the single announcement for a route-level
 * `loading.tsx` boundary. Both are presentational and hook-free, so they render
 * from Server and Client Components alike.
 *
 * Accessibility contract:
 *   - `Skeleton` is always `aria-hidden`: a placeholder carries no information.
 *   - `LoadingRegion` is the only node exposed to assistive tech. It is a
 *     `role="status"` region whose visual content is hidden, so a screen reader
 *     announces the label once and never reads the placeholder geometry.
 *   - No placeholder is focusable, so keyboard users cannot tab into a skeleton.
 *
 * The pulse is decorative and is neutralised by the global
 * `prefers-reduced-motion` guard in `globals.css`.
 */

export type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-testid="skeleton"
      className={["animate-pulse rounded-control bg-surface-muted", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export type LoadingRegionProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function LoadingRegion({ label, children, className }: LoadingRegionProps) {
  return (
    <div className={className} data-testid="loading-region" role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
