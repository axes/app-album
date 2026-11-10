import type { SVGProps } from "react";

/**
 * DESIGN v2 §14 — the product logo.
 *
 * The mark itself lives in `LogoDefs` (declared once per page inside the
 * application shell); this component only instantiates it through
 * `<use href="#mark"/>`. That keeps the gradients and the `<symbol>` unique in
 * the document and lets every logo instance share the same definitions.
 *
 * Colours are fixed by DESIGN §14 and never read a theme token, so the mark is
 * identical in light and dark mode. Sizes are the three DESIGN sizes:
 * 32 px (bar), 48 px (header), 56 px (empty state).
 */
export const LOGO_SIZES = {
  sm: 32,
  md: 48,
  lg: 56,
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;

export type LogoProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  /** `sm` 32 px, `md` 48 px, `lg` 56 px. Defaults to `sm`. */
  size?: LogoSize;
  /** Accessible name. Defaults to the visible product name. */
  label?: string;
};

export function Logo({ size = "sm", label = "MiColección", className, ...rest }: LogoProps) {
  const pixels = LOGO_SIZES[size];

  return (
    <svg
      width={pixels}
      height={pixels}
      viewBox="0 0 200 200"
      role="img"
      aria-label={label}
      focusable="false"
      className={className}
      data-component="logo"
      data-logo-size={size}
      {...rest}
    >
      <use href="#mark" />
    </svg>
  );
}
