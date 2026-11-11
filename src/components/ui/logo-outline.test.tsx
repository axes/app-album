import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LogoOutline } from "./logo-outline";

describe("LogoOutline", () => {
  it("draws every stroke with a normalised path length and staggered delays", () => {
    const html = renderToStaticMarkup(<LogoOutline />);

    expect(html).toContain('data-animated="true"');
    expect(html.split("logo-draw-stroke").length - 1).toBe(4);
    expect(html.split('pathLength="1"').length - 1).toBe(4);
    for (const ms of [0, 450, 900, 1200]) {
      expect(html).toContain(`--logo-delay:${ms}ms`);
    }
    // The filled mark is revealed after the drawing.
    expect(html).toContain('href="#mark"');
    expect(html).toContain("logo-draw-fill");
  });

  it("offers a static outline without animation classes or the filled mark", () => {
    const html = renderToStaticMarkup(<LogoOutline animate={false} size={48} />);

    expect(html).toContain('width="48"');
    expect(html).not.toContain("logo-draw-");
    expect(html).not.toContain('href="#mark"');
  });

  it("names itself for assistive technology and carries no colour of its own", () => {
    const html = renderToStaticMarkup(<LogoOutline />);

    expect(html).toContain('aria-label="MiColección.cl"');
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\\b/);
    expect(html).not.toContain("var(--album-");
  });
});
