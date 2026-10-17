import type { ReactNode } from "react";

/**
 * Admin action bar (Commit 2 — admin foundation).
 *
 * A purely presentational flex row that groups the actions of an admin screen
 * (search, filters, primary action). It owns no state and no business logic;
 * the caller decides which controls to render.
 *
 * When `ariaLabel` is provided the row is exposed as a `role="toolbar"` so
 * assistive tech announces the group; otherwise it stays a plain container.
 */
export type AdminActionBarProps = {
  children: ReactNode;
  /** Optional accessible name. When present the row becomes a toolbar. */
  ariaLabel?: string;
  className?: string;
};

export function AdminActionBar({
  children,
  ariaLabel,
  className,
}: AdminActionBarProps) {
  return (
    <div
      role={ariaLabel ? "toolbar" : undefined}
      aria-label={ariaLabel}
      data-component="admin-action-bar"
      className={["flex flex-wrap items-center gap-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
