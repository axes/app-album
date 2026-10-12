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
};

export const proposalColorTokens: SemanticColorTokens = {
  background: { light: "#f7f5ff", dark: "#120b2e" },
  surface: { light: "#ffffff", dark: "#1d1347" },
  surfaceSoft: { light: "#efebfb", dark: "#160e3a" },
  border: { light: "#ddd6f3", dark: "#36286e" },
  input: { light: "#ffffff", dark: "#1d1347" },
  inputBorder: { light: "#8e81c2", dark: "#7a6cba" },
  foreground: { light: "#170b4a", dark: "#f4f1ff" },
  foregroundMuted: { light: "#5b5280", dark: "#b0a6da" },
  primary: { light: "#4a1fb8", dark: "#a78bfa" },
  primaryForeground: { light: "#ffffff", dark: "#120b2e" },
  secondary: { light: "#5b5280", dark: "#b0a6da" },
  secondaryForeground: { light: "#ffffff", dark: "#120b2e" },
  accent: { light: "#d93a00", dark: "#ff7a3d" },
  accentForeground: { light: "#ffffff", dark: "#120b2e" },
  success: { light: "#0f7a4f", dark: "#4ade80" },
  successForeground: { light: "#ffffff", dark: "#062b17" },
  warning: { light: "#9a5200", dark: "#fbbf24" },
  warningForeground: { light: "#ffffff", dark: "#2b1a00" },
  danger: { light: "#b3261e", dark: "#ff8a80" },
  dangerForeground: { light: "#ffffff", dark: "#3a0906" },
  focus: { light: "#6d43e8", dark: "#c4b5fd" },
  stickerOwned: { light: "#4a1fb8", dark: "#a78bfa" },
  stickerOwnedEnd: { light: "#2a1285", dark: "#6d43e8" },
  stickerMissing: { light: "#8e81c2", dark: "#7a6cba" },
  stickerDuplicate: { light: "#4a1fb8", dark: "#a78bfa" },
  stickerSpecial: { light: "#d93a00", dark: "#ff7a3d" },
  stickerSpecialEnd: { light: "#7a1d00", dark: "#d93a00" },
  stickerFold: { light: "#ffffff", dark: "#f4f1ff" },
};

export const radiusTokens = {
  radiusControl: "0.375rem",
  radiusCard: "0.5rem",
  radiusSticker: "0.875rem",
  radiusPill: "9999px",
} as const;

export const proposalRadiusTokens = {
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
} as const;

export const motionTokens = {
  motionFast: "150ms",
  motionNormal: "200ms",
  motionSpin: "800ms",
  easeStandard: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

export const typographyTokens = {
  fontBody: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  fontDisplay: '"Poppins", ui-rounded, "Trebuchet MS", system-ui, sans-serif',
  displaySize: "2rem",
  titleSize: "1.375rem",
  subtitleSize: "1rem",
  bodySize: "0.9375rem",
  labelSize: "0.8125rem",
  captionSize: "0.75rem",
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
  space5: "1.25rem",
  space6: "1.5rem",
  space8: "2rem",
  space12: "3rem",
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
  name: "App Álbum",
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

