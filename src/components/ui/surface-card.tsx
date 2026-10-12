import type { ReactNode } from "react";

/**
 * Surface / card container primitive (UI-04A).
 *
 * A bordered surface with an optional title, description and actions slot,
 * used to group related content. It is a plain function component with no
 * hooks, so it renders from Server and Client Components alike.
 *
 * The title is rendered as a level-2 heading so a card reads as a section of
 * the page. Colours come exclusively from the canonical `--album-*` tokens
 * exposed as Tailwind utilities.
 */
export type SurfaceCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function SurfaceCard({
  title,
  description,
  actions,
  children,
  className,
}: SurfaceCardProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <section
      className={[
        "flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? (
              <h2 className="text-base font-semibold text-content">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
