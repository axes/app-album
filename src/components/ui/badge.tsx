import type { ReactNode } from "react";

/**
 * Compact badge / status pill primitive (UI-04A).
 *
 * A small, non-interactive label used to surface a short status next to a
 * title, a table cell or a card. It is a plain function component with no
 * hooks, so it renders from Server and Client Components alike.
 *
 * The look is built only from the canonical `--album-*` tokens exposed as
 * Tailwind utilities (`text-*`, `border-*`, `bg-surface`). No palette hex is
 * hardcoded and no opacity modifier is applied over a CSS-variable colour, so
 * the pill stays legible in both light and dark themes.
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
  neutral: "border-border text-muted",
  primary: "border-primary text-primary",
  secondary: "border-secondary text-secondary",
  accent: "border-accent text-accent",
  success: "border-success text-success",
  warning: "border-warning text-warning",
  danger: "border-danger text-danger",
  info: "border-info text-info",
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
        "inline-flex w-fit items-center rounded-control border bg-surface px-2 py-0.5 text-xs font-medium",
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
