import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildProductiveTokensCss } from "./build-ui-tokens-css";
import {
  productiveColorTokens,
  productiveRadiusTokens,
  productiveShadowTokens,
  productiveMotionTokens,
  productiveTypographyTokens,
  semanticColorKeys,
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
    for (const key of semanticColorKeys) {
      expect(css).toContain(productiveColorTokens[key].light);
      expect(css).toContain(productiveColorTokens[key].dark);
    }
    expect(css).toContain(`--radius-control: ${productiveRadiusTokens.radiusControl}`);
    expect(css).toContain(`--radius-card: ${productiveRadiusTokens.radiusCard}`);
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
