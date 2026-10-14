import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  colorTokens,
  proposalColorTokens,
  semanticColorKeys,
} from "./ui-tokens";
import {
  buildDesignTokensJson,
  buildUiTokensCss,
} from "./build-ui-reference";

const KEY_FILES = [
  "src/app/dev/ui/page.tsx",
  "src/app/dev/ui/sticker-demo.tsx",
  "src/components/ui/app-shell.tsx",
  "src/components/ui/mobile-nav.tsx",
  "src/components/ui/nav-link.tsx",
  "src/components/ui/logo-placeholder.tsx",
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
    expect(css).toMatch(/--album-overlay:\s*#[0-9a-fA-F]+/);

    const overlay = read("src/app/app/albums/remove-button.tsx");
    expect(overlay).toContain("var(--album-overlay)");
    expect(overlay).not.toMatch(/var\(--album-text\)[^)]*backdrop/);
  });

  it("uses only a token-driven identity placeholder", () => {
    const page = read("src/app/dev/ui/page.tsx");
    const portable = read("scripts/build-ui-reference.ts");
    expect(page).toContain("proposal-identity-placeholder");
    expect(portable).toContain("identity-placeholder");
    expect(`${page}\n${portable}`).not.toMatch(/brand-mark|linearGradient|mark-base/i);
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
