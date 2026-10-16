// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Badge, type BadgeVariant } from "./badge";

afterEach(cleanup);

const variantExpectations: Array<[BadgeVariant, string, string]> = [
  // The background + border pair and the foreground colour the variant
  // must pair with. Filled variants use `text-on`; outline variants use
  // the muted text token except `neutral`, which uses the normal content
  // colour (DESIGN §9: "texto normal, no muted").
  ["neutral", "bg-surface-soft", "text-content"],
  ["primary", "bg-primary", "text-on"],
  ["secondary", "bg-surface-soft", "text-muted"],
  ["accent", "bg-accent", "text-on"],
  ["success", "bg-success", "text-on"],
  ["warning", "bg-warning", "text-on"],
  ["danger", "bg-danger", "text-on"],
  ["info", "bg-info", "text-on"],
];

describe("Badge (DESIGN v2 §9)", () => {
  it("renders its children inside a pill span", () => {
    render(<Badge>Nuevo</Badge>);

    const badge = screen.getByText("Nuevo");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.className).toContain("rounded-pill");
    expect(badge.className).toContain("inline-flex");
  });

  it("uses the 12/600 pill typography", () => {
    render(<Badge>Estado</Badge>);

    const className = screen.getByText("Estado").className;
    expect(className).toContain("text-xs");
    expect(className).toContain("font-semibold");
  });

  it("defaults to the neutral variant (surface-soft + content text, not muted)", () => {
    render(<Badge>Estado</Badge>);

    const className = screen.getByText("Estado").className;
    expect(className).toContain("bg-surface-soft");
    expect(className).toContain("border-border");
    expect(className).toContain("text-content");
    expect(className).not.toContain("text-muted");
  });

  it.each(variantExpectations)(
    "maps the %s variant to its semantic colour",
    (variant, expectedClass, expectedText) => {
      render(<Badge variant={variant}>Estado</Badge>);

      const className = screen.getByText("Estado").className;
      expect(className).toContain(expectedClass);
      expect(className).toContain(expectedText);
    },
  );

  it("uses text-muted for secondary so the discreet 'Bajo' state is visually quiet", () => {
    render(<Badge variant="secondary">Bajo</Badge>);

    const className = screen.getByText("Bajo").className;
    expect(className).toContain("bg-surface-soft");
    expect(className).toContain("border-border");
    expect(className).toContain("text-muted");
  });

  it("keeps info visually identical to primary (both resolve to --album-primary)", () => {
    const { rerender } = render(<Badge variant="primary">x</Badge>);
    const primaryClass = screen.getByText("x").className;
    // `info` swaps the literal class names (`bg-info` / `border-info`) but
    // the rendered colour is identical: `--color-info` and `--color-primary`
    // both resolve to `--album-primary` in both themes. The class names
    // differ on purpose so the caller can tell which one they used.
    rerender(<Badge variant="info">x</Badge>);
    const infoClass = screen.getByText("x").className;
    expect(infoClass).not.toBe(primaryClass);
    expect(infoClass).toContain("bg-info");
    expect(infoClass).toContain("text-on");
  });

  it("merges a caller-provided className", () => {
    render(<Badge className="custom">Estado</Badge>);

    expect(screen.getByText("Estado").className).toContain("custom");
  });
});
