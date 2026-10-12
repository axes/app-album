import { describe, expect, it } from "vitest";
import {
  assertMinRatio,
  buildProposalContrastPairs,
  meetsMinRatio,
  parseHexColor,
  relativeLuminance,
  wcagRatio,
} from "./contrast";

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

  it("documents unique light/dark text and non-text pairs", () => {
    const pairs = buildProposalContrastPairs();
    expect(pairs.length).toBeGreaterThanOrEqual(30);
    expect(new Set(pairs.map((pair) => pair.name)).size).toBe(pairs.length);
    expect(pairs.some((pair) => pair.name.includes("sticker-special"))).toBe(true);
    expect(pairs.some((pair) => pair.name.includes("focus"))).toBe(true);
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
