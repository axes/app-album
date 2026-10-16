"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "./icons";

/**
 * Collapsible surface card (Commit 2 — admin foundation).
 *
 * A `SurfaceCard`-shaped section whose whole header is a disclosure button.
 * It is a client component because it owns the open/closed state; the visual
 * shell reuses the same tokens as `SurfaceCard` (card radius, border, surface
 * background, no shadow).
 *
 * Accessibility contract:
 *   - the header is a single `<button>` inside an `<h3>` (18/600 title), so
 *     the disclosure is reachable and operable from the keyboard;
 *   - the button carries `aria-expanded` and `aria-controls` pointing at the
 *     panel id;
 *   - the panel is only mounted while open, so its content is not exposed to
 *     assistive tech when collapsed;
 *   - the affordance is the DESIGN v2 §6 `chevronDown` icon (20 px), rotated
 *     when open — never a text glyph and never a native `<details>`.
 */
export type CollapsibleSurfaceCardProps = {
  title: string;
  /** Optional 12 px supporting line under the title. */
  summary?: string;
  /** Initial open state. Defaults to collapsed. */
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function CollapsibleSurfaceCard({
  title,
  summary,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSurfaceCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `${useId()}-panel`;

  return (
    <section
      data-component="collapsible-surface-card"
      className={[
        "rounded-card border border-border bg-surface shadow-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 rounded-card p-4 text-left"
        >
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-lg font-semibold text-content">{title}</span>
            {summary ? (
              <span className="text-xs text-muted">{summary}</span>
            ) : null}
          </span>
          <Icon
            name="chevronDown"
            size="md"
            className={open ? "rotate-180 transition-transform" : "transition-transform"}
          />
        </button>
      </h3>
      {open ? (
        <div id={panelId} className="border-t border-border p-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}
