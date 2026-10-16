import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildProductiveTokensCss } from "./build-ui-tokens-css";
import {
  productiveCanonicalColorTokens,
  productiveRadiusTokens,
  productiveShadowTokens,
  productiveMotionTokens,
  productiveTypographyTokens,
} from "./ui-tokens";

const OUT_PATH = resolve(process.cwd(), "src/styles/tokens.css");

function normalise(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

describe("build-ui-tokens-css UI-05A productive tokens", () => {
  it("emits one light and one dark block with the canonical selectors", () => {
    const css = buildProductiveTokensCss();
    expect(css).toMatch(/:root,\s*\[data-theme="light"\]\s*\{/);
    expect(css).toMatch(/\[data-theme="dark"],\s*\.dark\s*\{/);
  });

  it("propagates every productive token to the generated CSS", () => {
    const css = buildProductiveTokensCss();
    for (const token of Object.values(productiveCanonicalColorTokens)) {
      expect(css).toContain(token.light);
      expect(css).toContain(token.dark);
    }
    expect(css).toContain("--album-on:");
    expect(css).toContain("--album-owned-a:");
    expect(css).toContain("--album-special-on:");
    expect(css).toContain("--album-primary-content: var(--album-on)");
    expect(css).toContain(
      `--album-radius-mini: ${productiveRadiusTokens.radiusMini}`,
    );
    expect(css).toContain(
      `--album-radius-control: ${productiveRadiusTokens.radiusControl}`,
    );
    expect(css).toContain(
      `--album-radius-card: ${productiveRadiusTokens.radiusCard}`,
    );
    expect(css).toContain(
      `--album-radius-sticker: ${productiveRadiusTokens.radiusSticker}`,
    );
    expect(css).toContain(
      `--album-radius-pill: ${productiveRadiusTokens.radiusPill}`,
    );
    expect(css).toContain(
      `--shadow-sm: ${productiveShadowTokens.shadowSm.light}`,
    );
    expect(css).toContain(
      `--shadow-md: ${productiveShadowTokens.shadowMd.dark}`,
    );
    expect(css).toContain(
      `--motion-fast: ${productiveMotionTokens.motionFast}`,
    );
    expect(css).toContain(
      `--font-display: ${productiveTypographyTokens.fontDisplay}`,
    );
    expect(css).toContain(
      `--glow: ${productiveShadowTokens.shadowGlow.light}`,
    );
  });

  it("keeps the radius scale out of Tailwind's own --radius-* namespace", () => {
    const css = buildProductiveTokensCss();
    // Tailwind's `--radius-*` namespace owns the `rounded-*` utilities. A bare
    // `--radius-control` in this sheet would collide with the `@theme static`
    // mapping in `globals.css` and silently leave the utilities ungenerated.
    expect(css).not.toMatch(/^\s*--radius-(mini|control|card|sticker|pill):/m);
  });

  it("matches the versioned src/styles/tokens.css byte-for-byte", () => {
    const onDisk = normalise(readFileSync(OUT_PATH, "utf8"));
    const expected = normalise(buildProductiveTokensCss());
    if (onDisk !== expected) {
      const preview = (value: string): string =>
        value.split("\n").slice(0, 30).join("\n");
      throw new Error(
        [
          "src/styles/tokens.css is out of sync with scripts/ui-tokens.ts.",
          "Regenerate with `npm run ui:export` (which now writes this file).",
          "",
          "Expected (first 30 lines):",
          preview(expected),
          "",
          "On disk (first 30 lines):",
          preview(onDisk),
        ].join("\n"),
      );
    }
    expect(onDisk).toBe(expected);
  });
});
