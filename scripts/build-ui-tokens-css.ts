/**
 * UI-05A productive tokens generator.
 *
 * `scripts/ui-tokens.ts` is the single source of truth for visual tokens.
 * The productive AppShell must consume the same `--album-*` variables used by
 * `/dev/ui`, the portable CSS, the JSON handoff and the centralization guard.
 *
 * This generator reads exclusively from the `productive*` exports and produces
 * the `src/styles/tokens.css` artefact. The output is intentionally compatible
 * with the existing `@theme static` aliases and daisyUI theme blocks: every
 * `var(--album-*)` and the non-color tokens (`--album-radius-control`,
 * `--album-radius-card`, `--transition-fast`, `--transition-normal`,
 * `--ease-standard`, shadow, motion and typography variables) are declared once
 * per theme. No other file in the productive app should keep a second copy of
 * any of these values.
 *
 * The radius scale is emitted under the `--album-radius-*` prefix on purpose.
 * Tailwind's own `--radius-*` namespace owns the `rounded-*` utilities, so a
 * bare `--radius-control` here would collide with the `@theme static` mapping
 * in `globals.css` and leave the utilities ungenerated. The theme block points
 * at these productive names instead of repeating the values.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  cssNameByColorToken,
  productiveColorTokens,
  productiveMotionTokens,
  productiveRadiusTokens,
  productiveShadowTokens,
  productiveTypographyTokens,
  semanticColorKeys,
  type ThemeName,
} from "./ui-tokens.ts";

const OUT_PATH = resolve(process.cwd(), "src/styles/tokens.css");
const LIGHT_THEME: ThemeName = "light";
const DARK_THEME: ThemeName = "dark";

function colorDeclarations(theme: ThemeName): string {
  return semanticColorKeys
    .map(
      (key) =>
        `  --album-${cssNameByColorToken[key]}: ${productiveColorTokens[key][theme]};`,
    )
    .join("\n");
}

function shadowDeclarations(theme: ThemeName): string {
  return [
    `  --shadow-sm: ${productiveShadowTokens.shadowSm[theme]};`,
    `  --shadow-md: ${productiveShadowTokens.shadowMd[theme]};`,
    `  --shadow-lg: ${productiveShadowTokens.shadowLg[theme]};`,
  ].join("\n");
}

function radiusDeclarations(): string {
  return [
    `  --album-radius-control: ${productiveRadiusTokens.radiusControl};`,
    `  --album-radius-card: ${productiveRadiusTokens.radiusCard};`,
    `  --album-radius-sticker: ${productiveRadiusTokens.radiusSticker};`,
    `  --album-radius-pill: ${productiveRadiusTokens.radiusPill};`,
  ].join("\n");
}

function motionDeclarations(): string {
  return [
    `  --motion-fast: ${productiveMotionTokens.motionFast};`,
    `  --motion-normal: ${productiveMotionTokens.motionNormal};`,
    `  --motion-spin: ${productiveMotionTokens.motionSpin};`,
    `  --motion-ease: ${productiveMotionTokens.easeStandard};`,
    `  --transition-fast: ${productiveMotionTokens.motionFast};`,
    `  --transition-normal: ${productiveMotionTokens.motionNormal};`,
  ].join("\n");
}

function typographyDeclarations(): string {
  return [
    `  --font-display: ${productiveTypographyTokens.fontDisplay};`,
    `  --font-body: ${productiveTypographyTokens.fontBody};`,
  ].join("\n");
}

function themeBlock(selector: string, theme: ThemeName): string {
  const lines = [
    `${selector} {`,
    `  color-scheme: ${theme};`,
    colorDeclarations(theme).replace(/^  /gm, "  "),
    shadowDeclarations(theme),
    radiusDeclarations(),
    motionDeclarations(),
    typographyDeclarations(),
    `}`,
  ];
  return lines
    .filter((line) => line !== "" || line.startsWith(selector))
    .join("\n");
}

export function buildProductiveTokensCss(): string {
  const light = themeBlock(`:root,\n[data-theme="light"]`, LIGHT_THEME);
  const dark = themeBlock(`[data-theme="dark"],\n.dark`, DARK_THEME);
  return [
    "/*",
    " * Generated from scripts/ui-tokens.ts via scripts/build-ui-tokens-css.ts.",
    " * Do not maintain a palette here: change `productive*` exports in",
    " * `scripts/ui-tokens.ts` and re-run `npm run ui:export` to refresh this",
    " * file. The byte-for-byte equality is enforced by",
    " * `scripts/build-ui-tokens-css.test.ts`.",
    " */",
    "",
    light,
    "",
    dark,
    "",
  ].join("\n");
}

function writeProductiveTokensCss(): void {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, buildProductiveTokensCss(), "utf8");
}

function isMain(): boolean {
  try {
    return (
      Boolean(process.argv[1]) &&
      fileURLToPath(import.meta.url) === resolve(process.argv[1])
    );
  } catch {
    return false;
  }
}

if (isMain()) {
  writeProductiveTokensCss();
  process.stdout.write(`Wrote productive tokens to ${OUT_PATH}\n`);
}
