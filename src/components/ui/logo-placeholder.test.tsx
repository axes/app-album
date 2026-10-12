import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LogoPlaceholder } from "./logo-placeholder";

describe("LogoPlaceholder (UI-05A)", () => {
  it("renders a square token-driven placeholder without SVG or hex values", () => {
    const html = renderToStaticMarkup(
      <LogoPlaceholder label="Logo" />,
    );
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Logo"');
    expect(html).toContain("aspect-square");
    expect(html).toContain("bg-primary");
    expect(html).toContain("border-border");
    expect(html).toContain("rounded-control");
    expect(html).not.toMatch(/<svg/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("defaults to the App Álbum label when none is provided", () => {
    const html = renderToStaticMarkup(<LogoPlaceholder />);
    expect(html).toContain('aria-label="Logo de App Álbum"');
  });
});
