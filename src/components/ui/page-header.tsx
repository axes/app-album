import type { ReactNode } from "react";

/**
 * Compact page header primitive (UI-03B).
 *
 * A single title line with optional description, metadata and actions. It is
 * presentational and hook-free, so it renders from Server and Client
 * Components alike. The entrance utility is decorative and is removed under
 * `prefers-reduced-motion`.
 */
export type PageHeaderProps = {
  title: string;
  description?: string;
  metadata?: ReactNode;
  actions?: ReactNode;
  /**
   * Optional contextual back link rendered above the title (typically a
   * `next/link` anchor). Kept as a `ReactNode` so the header stays
   * presentational and the caller owns the destination and copy.
   */
  backLink?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  metadata,
  actions,
  backLink,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={[
        "animate-enter flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {backLink ? (
          <div className="type-caption text-muted">{backLink}</div>
        ) : null}
        <h1 className="text-content">{title}</h1>
        {description ? (
          <p className="type-small text-muted">{description}</p>
        ) : null}
        {metadata ? <div className="type-caption text-muted">{metadata}</div> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
