// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Progress, type ProgressVariant } from "./progress";

afterEach(cleanup);

const variantExpectations: Array<[ProgressVariant, string]> = [
  ["primary", "bg-primary"],
  ["accent", "bg-accent"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["danger", "bg-danger"],
];

describe("Progress", () => {
  it("exposes the full progressbar ARIA contract and required accessible name", () => {
    render(<Progress value={35} label="35% completado" />);

    const bar = screen.getByRole("progressbar", { name: "35% completado" });
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-valuenow")).toBe("35");
    expect(bar.getAttribute("aria-label")).toBe("35% completado");
  });

  it("renders the 0, 35, 70 and 100 reference values", () => {
    const { rerender } = render(<Progress value={0} label="Progreso 0%" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");

    rerender(<Progress value={35} label="Progreso 35%" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("35");

    rerender(<Progress value={70} label="Progreso 70%" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("70");

    rerender(<Progress value={100} label="Progreso 100%" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
  });

  it("clamps out-of-range values to the 0-100 scale", () => {
    const { rerender } = render(
      <Progress value={-20} label="Progreso bajo mínimo" />,
    );
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");

    rerender(<Progress value={250} label="Progreso sobre máximo" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
  });

  it("derives the percentage from a custom max", () => {
    render(<Progress value={3} max={4} label="Tres de cuatro" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("75");
  });

  it("fills the inner bar with the computed width", () => {
    const { container } = render(
      <Progress value={70} label="Progreso al 70%" />,
    );
    const fill = container.querySelector<HTMLElement>("[style]");
    expect(fill?.style.width).toBe("70%");
  });

  it.each(variantExpectations)(
    "applies the %s variant to the fill",
    (variant, expected) => {
      const { container } = render(
        <Progress value={50} variant={variant} label={`Progreso ${variant}`} />,
      );
      expect(container.querySelector("[style]")?.className).toContain(expected);
    },
  );

  it("defaults to the success variant and the muted track", () => {
    const { container } = render(
      <Progress value={50} label="Progreso predeterminado" />,
    );
    expect(container.querySelector("[style]")?.className).toContain("bg-success");
    expect(screen.getByRole("progressbar").className).toContain("bg-surface-muted");
  });

  it("merges a caller-provided className", () => {
    render(
      <Progress value={50} label="Progreso personalizado" className="custom" />,
    );
    expect(screen.getByRole("progressbar").className).toContain("custom");
  });
});
