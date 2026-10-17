import { describe, expect, it } from "vitest";
import {
  assertMinRatio,
  buildProposalContrastPairs,
  meetsMinRatio,
  mixSrgb,
  parseHexColor,
  relativeLuminance,
  wcagRatio,
} from "./contrast";
import { productiveCanonicalColorTokens } from "./ui-tokens";

describe("contrast (WCAG 2.1)", () => {
  const light = (key: keyof typeof productiveCanonicalColorTokens) =>
    productiveCanonicalColorTokens[key].light;

  it("computes canonical token extremes", () => {
    expect(wcagRatio(light("foreground"), light("surface"))).toBeGreaterThan(15);
    expect(wcagRatio(light("surface"), light("surface"))).toBeCloseTo(1, 5);
  });

  it("parses full token HEX and rejects shortened token input", () => {
    expect(parseHexColor(light("primary"))).toHaveLength(3);
    expect(() => parseHexColor(light("primary").slice(0, 4))).toThrow(
      /Invalid hex/,
    );
  });

  it("computes luminance and boolean minimums from canonical tokens", () => {
    expect(relativeLuminance(light("foreground"))).toBeLessThan(0.02);
    expect(relativeLuminance(light("surface"))).toBeCloseTo(1, 5);
    expect(meetsMinRatio(light("foreground"), light("background"))).toBe(true);
  });

  it("mixes canonical tokens in sRGB without embedding colour literals", () => {
    expect(
      mixSrgb(light("danger"), light("surface"), 12),
    ).not.toBe(light("danger"));
    expect(() => mixSrgb(light("danger"), light("surface"), 101)).toThrow(
      /between 0 and 100/,
    );
  });

  it("documents the 17 DESIGN and dangerGhost pairs for both themes", () => {
    const pairs = buildProposalContrastPairs();
    expect(pairs).toHaveLength(34);
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
        "danger/surface",
        "danger/hover",
        "danger/selected-row",
        "danger/hover-on-selected-row",
        "danger/hover-on-surface-soft",
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
    const sameToken = light("surface");
    expect(() =>
      assertMinRatio([{ name: "bad", fg: sameToken, bg: sameToken }]),
    ).toThrow(/bad.*1\.00:1/s);
  });
});
