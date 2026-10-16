import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  colorTokens,
  productiveCanonicalColorTokens,
  proposalColorTokens,
  semanticColorKeys,
} from "./ui-tokens";
import {
  buildDesignTokensJson,
  buildUiTokensCss,
} from "./build-ui-reference";
import { buildProductiveTokensCss } from "./build-ui-tokens-css";

const KEY_FILES = [
  "src/app/dev/ui/page.tsx",
  "src/app/dev/ui/sticker-demo.tsx",
  "src/components/ui/app-shell.tsx",
  "src/components/ui/mobile-nav.tsx",
  "src/components/ui/nav-link.tsx",
  "src/components/ui/icons.tsx",
  "scripts/build-ui-reference.ts",
  "scripts/build-ui-tokens-css.ts",
  // UI-05B: productive album library surfaces.
  "src/components/albums/album-cover.tsx",
  "src/components/albums/album-progress.tsx",
  "src/components/albums/album-card.tsx",
  "src/components/albums/empty-library.tsx",
  "src/app/app/page.tsx",
  "src/app/app/albums/page.tsx",
  "src/app/app/albums/add-button.tsx",
  "src/app/app/progress.tsx",
  // UI-05C: collection detail and sticker consumers.
  "src/app/app/albums/[userAlbumId]/page.tsx",
  "src/app/app/albums/[userAlbumId]/album-detail-hero.tsx",
  "src/components/albums/collection-summary.tsx",
  "src/app/app/albums/[userAlbumId]/view-toggle.tsx",
  "src/app/app/albums/[userAlbumId]/sticker-section.tsx",
  "src/app/app/albums/[userAlbumId]/sticker-card.tsx",
  "src/app/app/albums/[userAlbumId]/sticker-collection.tsx",
  "src/app/app/albums/[userAlbumId]/share-controls.tsx",
  "src/app/app/albums/quantity-button.tsx",
];

// Concrete CSS colours belong to ui-tokens.ts. Patterns deliberately ignore
// token-driven visible text because page/build only render values imported from
// that source; there must be no literal palette in either key consumer.
const HEX_LITERAL = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_LITERAL = /\brgba?\(\s*\d/g;

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("UI-04A.3 token centralization", () => {
  it.each(KEY_FILES)("contains no concrete HEX/RGB palette in %s", (path) => {
    const source = read(path);
    expect(source.match(HEX_LITERAL) ?? [], path).toEqual([]);
    expect(source.match(RGB_LITERAL) ?? [], path).toEqual([]);
  });

  it("keeps current and proposed on the same semantic interface", () => {
    expect(Object.keys(colorTokens)).toEqual([...semanticColorKeys]);
    expect(Object.keys(proposalColorTokens)).toEqual([...semanticColorKeys]);
  });

  it("generates the DESIGN v2 productive contract with temporary aliases", () => {
    const css = buildProductiveTokensCss();
    const required = [
      "background", "surface", "surface-soft", "border", "input-border",
      "text", "text-muted", "on", "primary", "accent", "focus", "success",
      "warning", "danger", "owned-a", "owned-b", "special-a", "special-b",
      "special-on",
    ];
    for (const name of required) expect(css).toContain(`--album-${name}:`);
    for (const token of Object.values(productiveCanonicalColorTokens)) {
      expect(css).toContain(token.light);
      expect(css).toContain(token.dark);
    }
    expect(css).toContain("--album-primary-content: var(--album-on)");
    expect(css).toContain("--album-secondary: var(--album-surface)");
    expect(css).toContain("--album-secondary-content: var(--album-text)");
  });

  it("propagates every semantic proposal token to CSS and JSON", () => {
    const css = buildUiTokensCss();
    const json = JSON.parse(buildDesignTokensJson());
    for (const key of semanticColorKeys) {
      expect(json.color.proposed.light[key]).toBe(proposalColorTokens[key].light);
      expect(json.color.proposed.dark[key]).toBe(proposalColorTokens[key].dark);
      expect(css).toContain(proposalColorTokens[key].light);
      expect(css).toContain(proposalColorTokens[key].dark);
    }
  });

  it("centralizes all auxiliary sticker colours", () => {
    for (const key of ["stickerOwnedEnd", "stickerSpecialEnd", "stickerFold"] as const) {
      expect(semanticColorKeys).toContain(key);
      expect(colorTokens[key].light).toBeTruthy();
      expect(proposalColorTokens[key].dark).toBeTruthy();
    }
    expect(read("src/app/dev/ui/page.tsx")).toContain("var(--album-sticker-owned-end)");
    expect(read("scripts/build-ui-reference.ts")).toContain("var(--album-sticker-special-end)");
  });

  it("centralizes the overlay colour and consumes it via --album-overlay", () => {
    expect(semanticColorKeys).toContain("overlay");
    expect(colorTokens.overlay.light).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(colorTokens.overlay.dark).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(proposalColorTokens.overlay.light).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(proposalColorTokens.overlay.dark).toMatch(/^#[0-9a-fA-F]{3,8}$/);

    const css = read("src/styles/tokens.css");
    expect(css).toContain("--album-overlay: var(--album-background)");

    const overlay = read("src/app/app/albums/remove-button.tsx");
    expect(overlay).toContain("var(--album-overlay)");
    expect(overlay).not.toMatch(/var\(--album-text\)[^)]*backdrop/);
  });

  it("centralizes the special accent and its derived glow", () => {
    expect(semanticColorKeys).toContain("special");
    expect(semanticColorKeys).toContain("specialForeground");
    expect(colorTokens.special.light).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(colorTokens.special.dark).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(colorTokens.specialForeground.light).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(colorTokens.specialForeground.dark).toMatch(/^#[0-9a-fA-F]{3,8}$/);

    const css = buildProductiveTokensCss();
    expect(css).toContain("--album-special-a: #d93a00");
    expect(css).toContain("--album-special-on: #ffffff");
    expect(css).toContain("--album-special: var(--album-special-a)");
    expect(css).toContain("--album-special-content: var(--album-special-on)");

    const globals = read("src/app/globals.css");
    expect(globals).toContain("--album-special-glow");
    expect(globals).toContain("color-mix(in srgb, var(--album-special)");
    expect(globals).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("uses only a token-driven identity placeholder", () => {
    const page = read("src/app/dev/ui/page.tsx");
    const portable = read("scripts/build-ui-reference.ts");
    expect(page).toContain("proposal-identity-placeholder");
    expect(portable).toContain("identity-placeholder");
    expect(`${page}\n${portable}`).not.toMatch(/brand-mark|linearGradient|mark-base/i);
  });

  // DESIGN v2 §14: the logo colours are fixed and must never read a theme
  // token, so `logo.tsx` and `logo-defs.tsx` are the only two files allowed to
  // carry hex literals outside `scripts/ui-tokens.ts`. This test pins the
  // exact palette and proves the exception stays confined to those two files.
  it("confines the fixed logo palette to the logo components", () => {
    const LOGO_FILES = [
      "src/components/ui/logo.tsx",
      "src/components/ui/logo-defs.tsx",
    ];
    const DESIGN_LOGO_HEX = [
      "#4a1fb8",
      "#2a1285",
      "#ff8a2b",
      "#ff4d12",
      "#6b2fc9",
      "#f0583a",
      "#190c58",
      "#5b34e0",
      "#ffc48f",
    ];

    const defs = read("src/components/ui/logo-defs.tsx");
    for (const hex of DESIGN_LOGO_HEX) {
      expect(defs, `logo-defs.tsx must declare ${hex}`).toContain(hex);
    }

    // The mark itself is declared once; `Logo` only references it. Comments
    // are stripped first so prose that names the tags does not trip the check.
    const logo = read("src/components/ui/logo.tsx").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(logo).toContain('href="#mark"');
    expect(logo).not.toMatch(/<symbol\b|<linearGradient\b/);
    expect(logo).not.toMatch(HEX_LITERAL);

    // No other key file may carry the logo palette.
    for (const path of KEY_FILES) {
      if (LOGO_FILES.includes(path)) continue;
      const source = read(path);
      for (const hex of DESIGN_LOGO_HEX) {
        expect(source, `${path} must not embed the logo colour ${hex}`).not.toContain(hex);
      }
    }
  });

  it("does not introduce colour-coupled token names", () => {
    expect(semanticColorKeys.join(" ")).not.toMatch(
      /violet|purple|orange|cyan|red|green|logo/i,
    );
  });

  // UI-05B: the productive AlbumCover is a token-driven placeholder.
  // It must never embed an inline SVG, a CSS gradient string or a
  // hard-coded data: URL — it is composed entirely from `--album-*`
  // tokens and Tailwind utilities. The wrapper accepts a dynamic
  // `coverUrl` (a runtime value), so the assertion targets the
  // static source code only.
  it("AlbumCover stays free of inline SVG, gradients and data URLs", () => {
    const source = read("src/components/albums/album-cover.tsx");
    expect(source).not.toMatch(/<svg\b/i);
    expect(source).not.toMatch(/linearGradient/i);
    expect(source).not.toMatch(/data:image\//i);
  });

  it("keeps sticker state colours token-driven and never invents special state", () => {
    const source = read("src/app/app/albums/[userAlbumId]/sticker-card.tsx");
    expect(source).toContain("var(--album-sticker-missing)");
    expect(source).toContain("var(--album-sticker-owned)");
    expect(source).toContain("var(--album-sticker-duplicate)");
    expect(source).not.toMatch(/album-sticker-special|<svg\b|data:image\//i);
  });
});
