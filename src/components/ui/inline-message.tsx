import type { ReactNode } from "react";

/**
 * Compact inline message / alert primitive (UI-03A).
 *
 * A single line of feedback for Server Action results and form states. Errors
 * are announced assertively (`role="alert"`); every other variant is announced
 * politely (`role="status"`, which implies `aria-live="polite"`).
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

export type InlineMessageProps = {
  variant?: InlineMessageVariant;
  children: ReactNode;
  className?: string;
};

export function InlineMessage({
  variant = "info",
  children,
  className,
}: InlineMessageProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
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
