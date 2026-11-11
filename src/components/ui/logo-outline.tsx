import type { CSSProperties, SVGProps } from "react";
import {
  LOGO_FOLD_PATH,
  LOGO_STICKER_PATH,
  LOGO_STICKER_TRANSFORM,
  LOGO_WINDOW,
} from "./logo-geometry";

/**
 * Line version of the MiColección.cl mark.
 *
 * - Static (`animate={false}`): the outline alone, for places where the filled
 *   mark is too heavy.
 * - Animated (default): the outline draws itself stroke by stroke and then the
 *   filled mark fades in over it. The animation is CSS only (`logo-draw` in
 *   `globals.css`), plays once, and is skipped under reduced motion, where the
 *   final state is shown straight away.
 *
 * Strokes are painted with the gradients declared once by `LogoDefs`, so this
 * file carries no colour of its own.
 */
export type LogoOutlineProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  /** Rendered width and height in pixels. Defaults to 96. */
  size?: number;
  /** Draw the outline on mount, then reveal the filled mark. Defaults to true. */
  animate?: boolean;
  /** Accessible name. Defaults to the product name. */
  label?: string;
};

/** Each stroke starts when the previous one is well under way. */
const delay = (ms: number) => ({ "--logo-delay": `${ms}ms` }) as CSSProperties;

export function LogoOutline({
  size = 96,
  animate = true,
  label = "MiColección.cl",
  className,
  ...rest
}: LogoOutlineProps) {
  const stroke = animate ? "logo-draw-stroke" : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={label}
      focusable="false"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-component="logo-outline"
      data-animated={animate ? "true" : undefined}
      {...rest}
    >
      <g className={animate ? "logo-draw-outline" : undefined}>
        <rect
          x="14"
          y="14"
          width="172"
          height="172"
          rx="48"
          pathLength={1}
          stroke="url(#g4)"
          strokeWidth="8"
          className={stroke}
          style={delay(0)}
        />
        <g transform={LOGO_STICKER_TRANSFORM}>
          <path
            d={LOGO_STICKER_PATH}
            pathLength={1}
            stroke="url(#g2)"
            strokeWidth="8"
            className={stroke}
            style={delay(450)}
          />
          <rect
            {...LOGO_WINDOW}
            pathLength={1}
            stroke="url(#g3)"
            strokeWidth="7"
            className={stroke}
            style={delay(900)}
          />
          <path
            d={LOGO_FOLD_PATH}
            pathLength={1}
            stroke="url(#g2)"
            strokeWidth="8"
            className={stroke}
            style={delay(1200)}
          />
        </g>
      </g>
      {animate ? <use href="#mark" className="logo-draw-fill" /> : null}
    </svg>
  );
}
