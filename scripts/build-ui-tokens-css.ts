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
  functionalSizeTokens,
  productiveCanonicalColorTokens,
  productiveMotionTokens,
  productiveRadiusTokens,
  productiveShadowTokens,
  productiveTypographyTokens,
  spacingTokens,
  type ThemeName,
} from "./ui-tokens.ts";

const OUT_PATH = resolve(process.cwd(), "src/styles/tokens.css");
const LIGHT_THEME: ThemeName = "light";
const DARK_THEME: ThemeName = "dark";

const canonicalColorCssNames = {
  background: "background",
  surface: "surface",
  surfaceSoft: "surface-soft",
  border: "border",
  inputBorder: "input-border",
  foreground: "text",
  foregroundMuted: "text-muted",
  on: "on",
  primary: "primary",
  accent: "accent",
  focus: "focus",
  success: "success",
  warning: "warning",
  danger: "danger",
  ownedA: "owned-a",
  ownedB: "owned-b",
  specialA: "special-a",
  specialB: "special-b",
  specialOn: "special-on",
} as const;

function colorDeclarations(theme: ThemeName): string {
  const canonical = Object.entries(canonicalColorCssNames)
    .map(([key, cssName]) => {
      const token = productiveCanonicalColorTokens[
        key as keyof typeof productiveCanonicalColorTokens
      ];
      return `  --album-${cssName}: ${token[theme]};`;
    });
  const compatibility = [
    "  /* Temporary compatibility aliases; remove in the base-components step. */",
    "  --album-input: var(--album-surface);",
    "  --album-primary-content: var(--album-on);",
    "  --album-secondary: var(--album-surface);",
    "  --album-secondary-content: var(--album-text);",
    "  --album-accent-content: var(--album-on);",
    "  --album-success-content: var(--album-on);",
    "  --album-warning-content: var(--album-on);",
    "  --album-danger-content: var(--album-on);",
    "  --album-sticker-owned: var(--album-owned-a);",
    "  --album-sticker-owned-end: var(--album-owned-b);",
    "  --album-sticker-missing: var(--album-text-muted);",
    "  --album-sticker-duplicate: var(--album-accent);",
    "  --album-sticker-special: var(--album-special-a);",
    "  --album-sticker-special-end: var(--album-special-b);",
    "  --album-sticker-fold: var(--album-on);",
    "  --album-overlay: var(--album-background);",
    "  --album-special: var(--album-special-a);",
    "  --album-special-content: var(--album-special-on);",
  ];
  return [...canonical, ...compatibility].join("\n");
}

function shadowDeclarations(theme: ThemeName): string {
  return [
    `  --shadow-sm: ${productiveShadowTokens.shadowSm[theme]};`,
    `  --shadow-md: ${productiveShadowTokens.shadowMd[theme]};`,
    `  --shadow-lg: ${productiveShadowTokens.shadowLg[theme]};`,
    `  --glow: ${productiveShadowTokens.shadowGlow[theme]};`,
  ].join("\n");
}

function radiusDeclarations(): string {
  return [
    `  --album-radius-mini: ${productiveRadiusTokens.radiusMini};`,
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

function sharedDeclarations(): string {
  return [
    `  --s1: ${spacingTokens.space1};`,
    `  --s2: ${spacingTokens.space2};`,
    `  --s3: ${spacingTokens.space3};`,
    `  --s4: ${spacingTokens.space4};`,
    `  --s6: ${spacingTokens.space6};`,
    `  --s8: ${spacingTokens.space8};`,
    `  --s12: ${spacingTokens.space12};`,
    `  --font-display: ${productiveTypographyTokens.fontDisplay};`,
    `  --font-body: ${productiveTypographyTokens.fontBody};`,
    `  --text-display: ${productiveTypographyTokens.displaySize};`,
    `  --text-h1: ${productiveTypographyTokens.titleSize};`,
    `  --text-h2: ${productiveTypographyTokens.subtitleSize};`,
    "  --text-h3: 1.125rem;",
    `  --text-body: ${productiveTypographyTokens.bodySize};`,
    `  --text-button: ${productiveTypographyTokens.buttonSize};`,
    `  --text-small: ${productiveTypographyTokens.labelSize};`,
    `  --text-caption: ${productiveTypographyTokens.captionSize};`,
    `  --text-tile: ${productiveTypographyTokens.stickerSize};`,
    `  --text-tile-dense: ${productiveTypographyTokens.stickerDenseSize};`,
    `  --target-min: ${functionalSizeTokens.touchTargetMin};`,
    `  --layout-max: ${functionalSizeTokens.layoutMax};`,
    `  --bp-mobile: ${functionalSizeTokens.mobileBreakpoint};`,
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
    sharedDeclarations(),
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
    `@media (max-width: ${functionalSizeTokens.mobileBreakpoint}) {`,
    "  :root {",
    `    --text-display: ${productiveTypographyTokens.displayMobileSize};`,
    "  }",
    "}",
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
