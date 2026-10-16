import { describe, expect, it } from "vitest";
import {
  assertMinRatio,
  buildProposalContrastPairs,
  meetsMinRatio,
  parseHexColor,
  relativeLuminance,
  wcagRatio,
} from "./contrast";
import { productiveCanonicalColorTokens } from "./ui-tokens";

describe("contrast (WCAG 2.1)", () => {
  it("computes canonical extremes", () => {
    expect(wcagRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(wcagRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("parses full HEX and rejects invalid input", () => {
    expect(parseHexColor("#4a1fb8")).toEqual([74, 31, 184]);
    expect(() => parseHexColor("#fff")).toThrow(/Invalid hex/);
  });

  it("computes luminance and boolean minimums", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(meetsMinRatio("#170b4a", "#f7f5ff")).toBe(true);
  });

  it("documents the 12 DESIGN section 4 pairs for both themes", () => {
    const pairs = buildProposalContrastPairs();
    expect(pairs).toHaveLength(24);
    expect(new Set(pairs.map((pair) => pair.name)).size).toBe(pairs.length);
  });

  it("covers every required DESIGN section 4 pair", () => {
    const names = buildProposalContrastPairs().map((pair) => pair.name);
    for (const theme of ["light", "dark"] as const) {
      for (const fragment of [
        "text/background",
        "text-muted/surface-soft",
        "on/primary",
        "on/accent",
        "on/success",
        "on/warning",
        "on/danger",
        "primary/background",
        "focus/background",
        "input-border/surface",
        "white/owned-a",
        "special-on/special-a",
      ]) {
        expect(names, `${theme} ${fragment}`).toContain(`${theme} ${fragment}`);
      }
    }
  });

  it("uses one canonical on colour for all filled semantic roles", () => {
    for (const theme of ["light", "dark"] as const) {
      for (const role of ["primary", "accent", "success", "warning", "danger"] as const) {
        expect(
          wcagRatio(
            productiveCanonicalColorTokens.on[theme],
            productiveCanonicalColorTokens[role][theme],
          ),
          `${theme} on/${role}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("passes every proposal contrast contract", () => {
    expect(() => assertMinRatio(buildProposalContrastPairs())).not.toThrow();
    for (const pair of buildProposalContrastPairs()) {
      expect(wcagRatio(pair.fg, pair.bg), pair.name).toBeGreaterThanOrEqual(pair.min ?? 4.5);
    }
  });

  it("reports failures with name and measured ratio", () => {
    expect(() => assertMinRatio([{ name: "bad", fg: "#ffffff", bg: "#ffffff" }])).toThrow(/bad.*1\.00:1/s);
  });
});
