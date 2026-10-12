import type { ReactNode } from "react";

/**
 * Compact empty-state primitive (UI-03B).
 *
 * A centred title with optional description, action and a simple decorative
 * icon. It is presentational and hook-free, so it renders from Server and
 * Client Components alike.
 */
export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-6 py-10 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <div aria-hidden="true" className="text-2xl text-muted">
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="font-medium text-content">{title}</p>
        {description ? (
          <p className="text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action}
        </div>
      ) : null}
    </div>
  );
}
