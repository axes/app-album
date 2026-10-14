import type { ReactNode } from "react";

/**
 * Error-state primitive (UI-06B).
 *
 * The shared body of every route-level `error.tsx` boundary. It is a plain
 * function component with no hooks, so it renders from Server and Client
 * Components alike, exactly like the other primitives.
 *
 * Accessibility contract:
 *   - The title is a real `<h1>`: an error boundary replaces the page content,
 *     so at that moment it is the document's main heading.
 *   - `role="alert"` wraps only the text block, never the actions. A live region
 *     containing interactive controls is noisy and can interrupt keyboard
 *     navigation; the message is short and is announced once.
 *   - No `aria-labelledby`: it would need `useId()` for nothing, since the `<h1>`
 *     already provides the structure and `role="alert"` provides the
 *     announcement.
 *   - No auto-focus: the boundary never steals focus.
 *
 * The caller owns the copy and the actions, so the same primitive serves the
 * authenticated and the admin segments without a hierarchy of error types.
 */
export type ErrorStateProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function ErrorState({
  title,
  description,
  actions,
  className,
}: ErrorStateProps) {
  return (
    <div
      data-component="error-state"
      className={[
        "flex flex-col items-center gap-4 rounded-card border border-border bg-surface px-6 py-10 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div role="alert" className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-content">{title}</h1>
        {description ? (
          <p className="text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
