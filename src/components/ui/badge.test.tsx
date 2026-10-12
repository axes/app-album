// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Badge, type BadgeVariant } from "./badge";

afterEach(cleanup);

const variantExpectations: Array<[BadgeVariant, string]> = [
  ["neutral", "text-muted"],
  ["primary", "text-primary"],
  ["secondary", "text-secondary"],
  ["accent", "text-accent"],
  ["success", "text-success"],
  ["warning", "text-warning"],
  ["danger", "text-danger"],
  ["info", "text-info"],
];

describe("Badge", () => {
  it("renders its children inside a span", () => {
    render(<Badge>Nuevo</Badge>);

    const badge = screen.getByText("Nuevo");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.textContent).toBe("Nuevo");
  });

  it("defaults to the neutral variant", () => {
    render(<Badge>Estado</Badge>);

    const className = screen.getByText("Estado").className;
    expect(className).toContain("border-border");
    expect(className).toContain("text-muted");
  });

  it.each(variantExpectations)(
    "maps the %s variant to its semantic colour",
    (variant, expected) => {
      render(<Badge variant={variant}>Estado</Badge>);

      expect(screen.getByText("Estado").className).toContain(expected);
    },
  );

  it("uses the shared surface and control radius tokens", () => {
    render(<Badge>Estado</Badge>);

    const className = screen.getByText("Estado").className;
    expect(className).toContain("bg-surface");
    expect(className).toContain("rounded-control");
  });

  it("merges a caller-provided className", () => {
    render(<Badge className="custom">Estado</Badge>);

    expect(screen.getByText("Estado").className).toContain("custom");
  });
});
