/**
 * Geometry of the MiColección.cl mark, shared by the filled symbol
 * (`LogoDefs`) and the line version (`LogoOutline`) so both always describe
 * the same drawing. All coordinates live in a 200 × 200 box.
 *
 * The idea: a sticker being pressed onto a coloured tile. In the filled mark
 * the sticker is negative space (the tile is cut out in its shape), with one
 * corner still lifted.
 */

/** Sticker silhouette: a rounded square whose bottom-left corner is lifted. */
export const LOGO_STICKER_PATH =
  "M64 45H136Q155 45 155 64V136Q155 155 136 155H81L45 119V64Q45 45 64 45Z";

/** The lifted corner, curling back over the sticker. */
export const LOGO_FOLD_PATH = "M45 119L81 155V135Q81 119 65 119Z";

/** The picture window printed on the sticker. */
export const LOGO_WINDOW = { x: 68, y: 62, width: 64, height: 50, rx: 12 } as const;

/** The sticker sits slightly askew, as if it had just been pressed on. */
export const LOGO_STICKER_TRANSFORM = "rotate(-8 100 100)";
