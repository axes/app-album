import type { ReactNode } from "react";

/**
 * Compact badge / status pill primitive (DESIGN v2 §9).
 *
 * A small, non-interactive label used to surface a short status next to a
 * title, a table cell or a card. It is a plain function component with no
 * hooks, so it renders from Server and Client Components alike.
 *
 * Variants (DESIGN §9):
 *   - `neutral`     — `bg-surface-muted`, `border-border`, `text-content`
 *                     (normal text, not muted). The default for product
 *                     metadata where the badge must read like a label.
 *   - `secondary`   — same `bg-surface-muted` + `border-border` pair as
 *                     `neutral`, but with `text-muted` so it reads as the
 *                     discreet "Bajo" state in `album-card.tsx`.
 *   - `primary`     — fill, `text-on` (DESIGN: `primary`).
 *   - `accent`      — fill, `text-on` (DESIGN: `accent`).
 *   - `success`     — fill, `text-on` (DESIGN: `success`).
 *   - `warning`     — fill, `text-on` (DESIGN: `warning`).
 *   - `danger`      — fill, `text-on` (DESIGN: `danger`).
 *   - `info`        — daisyUI's `--color-info` resolves to `--album-primary`
 *                     in both themes, so the rendered pill is visually
 *                     identical to `primary`. Kept in the type for callers
 *                     that follow the daisyUI vocabulary; no productive
 *                     consumer uses it today.
 *
 * `bg-surface-muted` is the canonical Tailwind utility for the
 * `--album-surface-soft` token: `globals.css` defines the alias
 * `--color-surface-muted: var(--album-surface-soft)` in `@theme static`,
 * so the compiled CSS exposes `.bg-surface-muted { background-color:
 * var(--color-surface-muted) }` (verified by `ui-utilities.test.ts`).
 */
export type BadgeVariant =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const variantClasses: Record<BadgeVariant, string> = {
  // DESIGN §9 "neutro: fondo surface-soft, borde border, texto normal".
  neutral: "bg-surface-muted border-border text-content",
  // DESIGN §9 calls for the same surface-soft + border pair, but the
  // product uses `secondary` to mark a discreet state ("Bajo") that
  // should not compete with the progress bar. The text is muted for
  // visual hierarchy, the background and border match `neutral`.
  secondary: "bg-surface-muted border-border text-muted",
  primary: "bg-primary border-primary text-on",
  accent: "bg-accent border-accent text-on",
  success: "bg-success border-success text-on",
  warning: "bg-warning border-warning text-on",
  danger: "bg-danger border-danger text-on",
  info: "bg-info border-info text-on",
};

export type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={[
        // DESIGN §9: 12/600, padding 3 × 10, pill radius, optional 16 px icon.
        "inline-flex w-fit items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
