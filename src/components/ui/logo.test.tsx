// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Logo, LOGO_SIZES } from "./logo";
import { LogoDefs } from "./logo-defs";

describe("Logo (DESIGN v2 §14)", () => {
  it("uses the three DESIGN sizes 32 / 48 / 56", () => {
    expect(LOGO_SIZES).toEqual({ sm: 32, md: 48, lg: 56 });
    for (const [size, pixels] of Object.entries(LOGO_SIZES)) {
      const html = renderToStaticMarkup(
        <Logo size={size as keyof typeof LOGO_SIZES} />,
      );
      expect(html).toContain(`width="${pixels}"`);
      expect(html).toContain(`height="${pixels}"`);
    }
  });

  it("defaults to the 32 px bar size and the visible product name", () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toContain('width="32"');
    expect(html).toContain('aria-label="MiColección"');
    expect(html).toContain('role="img"');
  });

  it("reuses the shared symbol instead of redeclaring it", () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toContain('href="#mark"');
    expect(html).not.toContain("<symbol");
    expect(html).not.toContain("<linearGradient");
  });

  it("accepts an explicit accessible name", () => {
    const html = renderToStaticMarkup(<Logo label="MiColección — inicio" />);
    expect(html).toContain('aria-label="MiColección — inicio"');
  });
});

describe("LogoDefs (DESIGN v2 §14)", () => {
  const html = renderToStaticMarkup(<LogoDefs />);

  it("declares the symbol and the three gradients exactly once", () => {
    for (const id of ["mark", "g1", "g2", "g3"]) {
      const occurrences = html.split(`id="${id}"`).length - 1;
      expect(occurrences, `id="${id}" must appear exactly once`).toBe(1);
    }
  });

  it("is invisible to assistive technology and paints nothing on its own", () => {
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="0"');
    expect(html).toContain('height="0"');
  });

  it("keeps the fixed DESIGN §14 palette", () => {
    for (const hex of [
      "#4a1fb8",
      "#2a1285",
      "#ff8a2b",
      "#ff4d12",
      "#6b2fc9",
      "#f0583a",
      "#190c58",
      "#5b34e0",
      "#ffc48f",
    ]) {
      expect(html).toContain(hex);
    }
  });

  it("never reads a theme token", () => {
    expect(html).not.toContain("var(--album-");
  });
});
