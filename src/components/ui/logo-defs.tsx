import {
  LOGO_FOLD_PATH,
  LOGO_STICKER_PATH,
  LOGO_STICKER_TRANSFORM,
  LOGO_WINDOW,
} from "./logo-geometry";

/**
 * DESIGN v2 §14 — logo definitions.
 *
 * The mark is a sticker being pressed onto a coloured tile: the tile is cut
 * out in the shape of the sticker (negative space) and one corner is still
 * lifted. It keeps the fixed DESIGN §14 palette.
 *
 * The `<symbol>` and its three gradients are declared exactly once per page,
 * inside the application shell. `Logo` then reuses them with
 * `<use href="#mark"/>`, so the document never carries duplicated ids and the
 * gradients are resolved once.
 *
 * The colours are **fixed** and intentionally hard-coded: the logo must look
 * the same in light and dark mode (the inner square stays dark in both), so it
 * must never read a theme token. These are the only hex literals allowed
 * outside `scripts/ui-tokens.ts`; `scripts/centralization.test.ts` whitelists
 * this file and `logo.tsx` for exactly that reason.
 *
 * The wrapper is a zero-sized, absolutely positioned, `aria-hidden` SVG: it
 * paints nothing on its own and is invisible to assistive technology.
 */
export function LogoDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      data-component="logo-defs"
      style={{ position: "absolute" }}
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a1fb8" />
          <stop offset="1" stopColor="#2a1285" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a2b" />
          <stop offset="1" stopColor="#ff4d12" />
        </linearGradient>
        <linearGradient id="g3" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#4a1fb8" />
          <stop offset=".55" stopColor="#6b2fc9" />
          <stop offset="1" stopColor="#f0583a" />
        </linearGradient>
        {/* Brighter violet for the line version, legible on dark surfaces. */}
        <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b34e0" />
          <stop offset="1" stopColor="#6b2fc9" />
        </linearGradient>
        {/* Cuts the sticker silhouette out of the tile: the sticker is
            negative space, so the surface behind the logo shows through. */}
        <mask id="mark-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
          <rect width="200" height="200" fill="white" />
          <path d={LOGO_STICKER_PATH} transform={LOGO_STICKER_TRANSFORM} fill="black" />
        </mask>
        <symbol id="mark" viewBox="0 0 200 200">
          <rect x="10" y="10" width="180" height="180" rx="52" fill="url(#g1)" mask="url(#mark-cut)" />
          <g transform={LOGO_STICKER_TRANSFORM}>
            <path
              d={LOGO_STICKER_PATH}
              fill="none"
              stroke="#5b34e0"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <rect {...LOGO_WINDOW} fill="none" stroke="url(#g3)" strokeWidth="9" />
            <path d="M45 119L81 155L81 119Z" fill="#190c58" opacity=".55" transform="translate(5 -5)" />
            <path
              d={LOGO_FOLD_PATH}
              fill="url(#g2)"
              stroke="#ffc48f"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}
