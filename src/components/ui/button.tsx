import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from "react";

/**
 * Compact button primitive (UI-03A, extended in UI-03B).
 *
 * It is a plain function component with no hooks, so it can be rendered from
 * both Server and Client Components. It only centralises the App Álbum button
 * look: compact heights (32 px / 40 px), a small closed set of variants and
 * transitions limited to specific properties using the shared tokens.
 *
 * Native `<button>` props (`type`, `name`, `value`, `disabled`, `form`,
 * `onClick`, `aria-*`, …) are forwarded untouched.
 *
 * UI-03B adds a single, opt-in `asChild` escape hatch so a link can be styled
 * like a button without nesting a `<button>` inside an `<a>` (invalid HTML).
 * The default behaviour — a real `<button>` — is unchanged.
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "link";

export type ButtonSize = "sm" | "md";

const baseClasses = [
  "btn min-h-0 rounded-control border-0 font-medium shadow-none",
  "transition-[color,background-color,border-color,opacity] duration-[var(--transition-fast)] ease-[var(--ease-standard)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary hover:opacity-90",
  secondary: "btn-secondary hover:opacity-90",
  danger: "btn-error hover:opacity-90",
  ghost: "btn-ghost text-content hover:bg-surface-muted",
  link: "btn-link text-primary underline-offset-2 hover:text-accent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * When `true`, Button does not render its own `<button>`. Instead it clones
   * its single child element (typically a `next/link` `<Link>`) and merges the
   * button classes onto it, so the child keeps its own semantics (an anchor
   * stays an anchor) while looking like a button.
   */
  asChild?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error(
        "Button with asChild expects exactly one React element child.",
      );
    }

    const child = children as ReactElement<{ className?: string }>;
    const childProps = {
      ...props,
      className: [child.props.className, classes].filter(Boolean).join(" "),
    };

    return cloneElement(child, childProps);
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
