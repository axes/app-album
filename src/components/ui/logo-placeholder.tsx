import type { HTMLAttributes } from "react";

/**
 * UI-05A: token-driven identity placeholder.
 *
 * A square block coloured with `bg-primary`, framed by `border-border` and
 * rounded with `rounded-control`. It never ships SVG, gradients or hard-coded
 * hex values, so swapping the productive palette is enough to repaint it.
 *
 * Used in the AppShell header and ready to be reused in empty states and
 * loading panels.
 */
export type LogoPlaceholderProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string;
};

export function LogoPlaceholder({
  label = "Logo de App Álbum",
  className,
  ...rest
}: LogoPlaceholderProps) {
  const classes = [
    "logo-placeholder",
    "inline-block aspect-square w-9 bg-primary",
    "border border-border rounded-control",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      role="img"
      aria-label={label}
      className={classes}
      data-component="logo-placeholder"
      {...rest}
    />
  );
}
