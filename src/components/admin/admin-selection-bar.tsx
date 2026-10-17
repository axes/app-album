import type { ReactNode } from "react";

/**
 * Admin selection bar (Commit 2 — admin foundation).
 *
 * A presentational bar that reports how many rows are selected and hosts the
 * bulk actions. It owns no state and no business logic: the caller passes the
 * `count` and the action controls as `children`.
 *
 * The count is announced through a polite live region so a screen-reader user
 * hears the selection change as rows are toggled. Only the count text is the
 * live region; the bulk actions are rendered as a sibling so they are not
 * re-announced every time the count changes.
 */
export type AdminSelectionBarProps = {
  /** Number of selected rows. */
  count: number;
  /** Noun shown after the count. Defaults to "seleccionadas". */
  label?: string;
  /** Bulk action controls. */
  children?: ReactNode;
  className?: string;
};

export function AdminSelectionBar({
  count,
  label = "seleccionadas",
  children,
  className,
}: AdminSelectionBarProps) {
  return (
    <div
      data-component="admin-selection-bar"
      className={[
        "flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface-muted px-4 py-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p
        role="status"
        aria-live="polite"
        className="text-sm font-medium tabular-nums text-content"
      >
        {count} {label}
      </p>
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
