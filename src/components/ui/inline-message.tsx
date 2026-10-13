import type { HTMLAttributes, ReactNode } from "react";

/**
 * Compact inline message / alert primitive (UI-03A).
 *
 * A single line of feedback for Server Action results and form states. Errors
 * are announced assertively (`role="alert"`); every other variant is announced
 * politely (`role="status"`, which implies `aria-live="polite"`).
 *
 * `role` and `aria-live` can be overridden by the caller when a more specific
 * semantics is required (for example, a polite "loading" status when the
 * message describes an in-flight action). Native HTML attributes (`data-*`,
 * `aria-*`, …) are forwarded untouched.
 */
export type InlineMessageVariant =
  | "error"
  | "success"
  | "warning"
  | "info"
  | "pending";

const variantClasses: Record<InlineMessageVariant, string> = {
  error: "border-danger",
  success: "border-success",
  warning: "border-warning",
  info: "border-info",
  pending: "border-border",
};

export type InlineMessageProps = HTMLAttributes<HTMLDivElement> & {
  variant?: InlineMessageVariant;
  children: ReactNode;
};

export function InlineMessage({
  variant = "info",
  children,
  className,
  role,
  ...props
}: InlineMessageProps) {
  return (
    <div
      {...props}
      role={role ?? (variant === "error" ? "alert" : "status")}
      className={[
        "alert min-h-0 rounded-control border bg-surface px-3 py-2 text-sm text-content shadow-none",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
