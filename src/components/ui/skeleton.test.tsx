// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LoadingRegion, Skeleton } from "./skeleton";

afterEach(cleanup);

const FOCUSABLE = "button, a, input, select, textarea, [tabindex]";

describe("Skeleton", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<Skeleton />);

    const block = container.querySelector('[data-testid="skeleton"]');
    expect(block).not.toBeNull();
    expect(block!.getAttribute("aria-hidden")).toBe("true");
  });

  it("uses the shared muted surface token and the control radius", () => {
    const { container } = render(<Skeleton />);

    const className = container.querySelector('[data-testid="skeleton"]')?.className ?? "";
    expect(className).toContain("bg-surface-muted");
    expect(className).toContain("rounded-control");
    expect(className).toContain("animate-pulse");
  });

  it("merges a caller-provided className for sizing", () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);

    const className = container.querySelector('[data-testid="skeleton"]')?.className ?? "";
    expect(className).toContain("h-4");
    expect(className).toContain("w-32");
  });
});

describe("LoadingRegion", () => {
  it("exposes a single status region with the accessible label", () => {
    render(
      <LoadingRegion label="Cargando tus álbumes">
        <Skeleton className="h-4 w-32" />
      </LoadingRegion>,
    );

    const region = screen.getByRole("status");
    expect(region.textContent).toContain("Cargando tus álbumes");
  });

  it("hides the placeholder geometry from assistive tech", () => {
    const { container } = render(
      <LoadingRegion label="Cargando">
        <Skeleton className="h-4 w-32" />
      </LoadingRegion>,
    );

    const hidden = container.querySelector('[data-testid="loading-region"] > div');
    expect(hidden?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders no focusable element", () => {
    const { container } = render(
      <LoadingRegion label="Cargando">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </LoadingRegion>,
    );

    expect(container.querySelectorAll(FOCUSABLE).length).toBe(0);
  });

  it("merges a caller-provided className", () => {
    const { container } = render(
      <LoadingRegion className="custom" label="Cargando">
        <Skeleton />
      </LoadingRegion>,
    );

    expect(container.querySelector('[data-testid="loading-region"]')?.className).toContain("custom");
  });
});
