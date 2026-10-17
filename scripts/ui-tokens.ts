/**
 * UI-04A.3 design tokens.
 *
 * This is the only source of concrete colours for the current reference and
 * the experimental proposal. `/dev/ui`, the portable CSS and the JSON handoff
 * consume these values; none of those consumers owns a second palette.
 */

export type ThemeName = "light" | "dark";
export type TokenPair = Readonly<Record<ThemeName, string>>;

export const semanticColorKeys = [
  "background",
  "surface",
  "surfaceSoft",
  "border",
  "input",
  "inputBorder",
  "foreground",
  "foregroundMuted",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "accent",
  "accentForeground",
  "success",
  "successForeground",
  "warning",
  "warningForeground",
  "danger",
  "dangerForeground",
  "focus",
  "stickerOwned",
  "stickerOwnedEnd",
  "stickerMissing",
  "stickerDuplicate",
  "stickerSpecial",
  "stickerSpecialEnd",
  "stickerFold",
  "overlay",
  "special",
  "specialForeground",
] as const;

export type SemanticColorKey = (typeof semanticColorKeys)[number];
export type SemanticColorTokens = Readonly<Record<SemanticColorKey, TokenPair>>;

export const cssNameByColorToken: Readonly<Record<SemanticColorKey, string>> = {
  background: "background",
  surface: "surface",
  surfaceSoft: "surface-soft",
  border: "border",
  input: "input",
  inputBorder: "input-border",
  foreground: "text",
  foregroundMuted: "text-muted",
  primary: "primary",
  primaryForeground: "primary-content",
  secondary: "secondary",
  secondaryForeground: "secondary-content",
  accent: "accent",
  accentForeground: "accent-content",
  success: "success",
  successForeground: "success-content",
  warning: "warning",
  warningForeground: "warning-content",
  danger: "danger",
  dangerForeground: "danger-content",
  focus: "focus",
  stickerOwned: "sticker-owned",
  stickerOwnedEnd: "sticker-owned-end",
  stickerMissing: "sticker-missing",
  stickerDuplicate: "sticker-duplicate",
  stickerSpecial: "sticker-special",
  stickerSpecialEnd: "sticker-special-end",
  stickerFold: "sticker-fold",
  overlay: "overlay",
  special: "special",
  specialForeground: "special-content",
};

export const colorTokens: SemanticColorTokens = {
  background: { light: "#f8fafc", dark: "#0f172a" },
  surface: { light: "#ffffff", dark: "#1e293b" },
  surfaceSoft: { light: "#f1f5f9", dark: "#0b1120" },
  border: { light: "#e2e8f0", dark: "#334155" },
  input: { light: "#ffffff", dark: "#1e293b" },
  inputBorder: { light: "#cbd5e1", dark: "#475569" },
  foreground: { light: "#0f172a", dark: "#f8fafc" },
  foregroundMuted: { light: "#64748b", dark: "#94a3b8" },
  primary: { light: "#c2410c", dark: "#f97316" },
  primaryForeground: { light: "#ffffff", dark: "#0f172a" },
  secondary: { light: "#475569", dark: "#94a3b8" },
  secondaryForeground: { light: "#ffffff", dark: "#0f172a" },
  accent: { light: "#0e7490", dark: "#22d3ee" },
  accentForeground: { light: "#ffffff", dark: "#0f172a" },
  success: { light: "#047857", dark: "#34d399" },
  successForeground: { light: "#ffffff", dark: "#052e16" },
  warning: { light: "#b45309", dark: "#fbbf24" },
  warningForeground: { light: "#ffffff", dark: "#422006" },
  danger: { light: "#b91c1c", dark: "#f87171" },
  dangerForeground: { light: "#ffffff", dark: "#450a0a" },
  focus: { light: "#0891b2", dark: "#06b6d4" },
  stickerOwned: { light: "#047857", dark: "#34d399" },
  stickerOwnedEnd: { light: "#065f46", dark: "#047857" },
  stickerMissing: { light: "#64748b", dark: "#94a3b8" },
  stickerDuplicate: { light: "#c2410c", dark: "#fb923c" },
  stickerSpecial: { light: "#0e7490", dark: "#22d3ee" },
  stickerSpecialEnd: { light: "#155e75", dark: "#0e7490" },
  stickerFold: { light: "#ffffff", dark: "#f8fafc" },
  overlay: { light: "#1f2448", dark: "#0b0820" },
  special: { light: "#fcd34d", dark: "#fcd34d" },
  specialForeground: { light: "#2d2a32", dark: "#2d2a32" },
};

const designV2 = {
  background: { light: "#f7f5ff", dark: "#130f1f" },
  surface: { light: "#ffffff", dark: "#1c1630" },
  surfaceSoft: { light: "#efebfb", dark: "#251d3f" },
  border: { light: "#ddd6f3", dark: "#3a2f5c" },
  inputBorder: { light: "#8e81c2", dark: "#6f63a8" },
  foreground: { light: "#170b4a", dark: "#f7f2ff" },
  foregroundMuted: { light: "#5b5280", dark: "#b9aedb" },
  on: { light: "#ffffff", dark: "#130f1f" },
  primary: { light: "#4a1fb8", dark: "#a78bfa" },
  accent: { light: "#d93a00", dark: "#ff8a4c" },
  focus: { light: "#6d43e8", dark: "#f7f2ff" },
  success: { light: "#0f7a4f", dark: "#4ade80" },
  warning: { light: "#9a5200", dark: "#fbbf24" },
  danger: { light: "#b3261e", dark: "#ff8a80" },
  ownedA: { light: "#6d3fd6", dark: "#7c4deb" },
  ownedB: { light: "#4a1fb8", dark: "#5b21b6" },
  specialA: { light: "#d93a00", dark: "#ff8a4c" },
  specialB: { light: "#b53000", dark: "#e8581c" },
  specialOn: { light: "#ffffff", dark: "#130f1f" },
} as const;

/**
 * DESIGN v2 productive palette. The legacy semantic interface remains only so
 * existing components keep rendering until the component-base step removes the
 * aliases. Every compatibility role points to a DESIGN v2 canonical value.
 */
export const proposalColorTokens: SemanticColorTokens = {
  background: designV2.background,
  surface: designV2.surface,
  surfaceSoft: designV2.surfaceSoft,
  border: designV2.border,
  input: designV2.surface,
  inputBorder: designV2.inputBorder,
  foreground: designV2.foreground,
  foregroundMuted: designV2.foregroundMuted,
  primary: designV2.primary,
  primaryForeground: designV2.on,
  secondary: designV2.surface,
  secondaryForeground: designV2.foreground,
  accent: designV2.accent,
  accentForeground: designV2.on,
  success: designV2.success,
  successForeground: designV2.on,
  warning: designV2.warning,
  warningForeground: designV2.on,
  danger: designV2.danger,
  dangerForeground: designV2.on,
  focus: designV2.focus,
  stickerOwned: designV2.ownedA,
  stickerOwnedEnd: designV2.ownedB,
  stickerMissing: designV2.foregroundMuted,
  stickerDuplicate: designV2.accent,
  stickerSpecial: designV2.specialA,
  stickerSpecialEnd: designV2.specialB,
  stickerFold: designV2.on,
  overlay: designV2.background,
  special: designV2.specialA,
  specialForeground: designV2.specialOn,
};

export const productiveCanonicalColorTokens = designV2;

export const radiusTokens = {
  radiusControl: "0.375rem",
  radiusCard: "0.5rem",
  radiusSticker: "0.875rem",
  radiusPill: "9999px",
} as const;

export const proposalRadiusTokens = {
  radiusMini: "0.5rem",
  radiusControl: "0.75rem",
  radiusCard: "1.25rem",
  radiusSticker: "0.875rem",
  radiusPill: "9999px",
} as const;

export const shadowTokens = {
  shadowSm: { light: "0 1px 2px rgb(15 23 42 / 0.05)", dark: "0 1px 2px rgb(0 0 0 / 0.3)" },
  shadowMd: { light: "0 4px 6px -1px rgb(15 23 42 / 0.1)", dark: "0 6px 14px -4px rgb(0 0 0 / 0.45)" },
  shadowLg: { light: "0 10px 15px -3px rgb(15 23 42 / 0.1)", dark: "0 18px 30px -10px rgb(0 0 0 / 0.55)" },
} as const;

export const proposalShadowTokens = {
  shadowSm: { light: "0 1px 2px rgb(23 11 74 / 0.06)", dark: "0 1px 2px rgb(0 0 0 / 0.3)" },
  shadowMd: { light: "0 6px 14px -4px rgb(23 11 74 / 0.14)", dark: "0 6px 14px -4px rgb(0 0 0 / 0.45)" },
  shadowLg: { light: "0 18px 30px -10px rgb(23 11 74 / 0.24)", dark: "0 18px 30px -10px rgb(0 0 0 / 0.55)" },
  shadowGlow: { light: "0 0 0 4px rgb(109 67 232 / 0.25)", dark: "0 0 0 4px rgb(167 139 250 / 0.3)" },
} as const;

export const motionTokens = {
  motionFast: "150ms",
  motionNormal: "200ms",
  motionSpin: "800ms",
  easeStandard: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

export const typographyTokens = {
  fontBody:
    'var(--font-inter), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  fontDisplay: 'var(--font-poppins), "Poppins", system-ui, sans-serif',
  displaySize: "2.5rem",
  displayMobileSize: "2rem",
  titleSize: "2rem",
  subtitleSize: "1.5rem",
  bodySize: "1rem",
  buttonSize: "0.9375rem",
  labelSize: "0.875rem",
  captionSize: "0.75rem",
  stickerSize: "1.25rem",
  stickerDenseSize: "1rem",
} as const;

export const fonts = {
  body: typographyTokens.fontBody,
  proposal: { heading: typographyTokens.fontDisplay },
} as const;

export const spacingTokens = {
  space1: "0.25rem",
  space2: "0.5rem",
  space3: "0.75rem",
  space4: "1rem",
  space6: "1.5rem",
  space8: "2rem",
  space12: "3rem",
} as const;

export const functionalSizeTokens = {
  touchTargetMin: "44px",
  layoutMax: "1120px",
  mobileBreakpoint: "640px",
} as const;

export const spacingScale = ["1", "2", "3", "4", "6", "8"] as const;
export const typographyScale = [
  { name: "display", className: "text-2xl font-semibold" },
  { name: "section title", className: "text-xl font-semibold" },
  { name: "subtitle", className: "text-base text-muted" },
  { name: "body", className: "text-sm text-content" },
  { name: "label", className: "text-sm font-medium" },
  { name: "caption", className: "text-xs text-muted" },
] as const;

export const projectMeta = {
  name: "MiColección",
  description: "Sistema visual de referencia portable y autocontenido.",
} as const;

// ---------------------------------------------------------------------------
// UI-05A: productive token aliases.
//
// The single source of truth for visual tokens remains `scripts/ui-tokens.ts`.
// The productive UI consumes the same set used by `/dev/ui`, the portable CSS
// and the JSON handoff. `productive*` exports reference the existing
// `proposal*` objects instead of duplicating their values, so changing a
// proposal token automatically propagates to the productive AppShell, the
// generated `src/styles/tokens.css` and the centralization guards.
//
// `colorTokens` (current) and `proposalColorTokens` (proposed) keep their
// shape and role: nothing in UI-04A.3 reads from the `productive*` aliases.
// ---------------------------------------------------------------------------

export const productiveColorTokens: SemanticColorTokens = proposalColorTokens;
export const productiveRadiusTokens: typeof proposalRadiusTokens =
  proposalRadiusTokens;
export const productiveShadowTokens: typeof proposalShadowTokens =
  proposalShadowTokens;
export const productiveMotionTokens: typeof motionTokens = motionTokens;
export const productiveTypographyTokens: typeof typographyTokens =
  typographyTokens;
