// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SurfaceCard } from "./surface-card";

afterEach(cleanup);

describe("SurfaceCard", () => {
  it("renders the title as a level-2 heading", () => {
    render(<SurfaceCard title="Resumen" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Resumen" }),
    ).toBeTruthy();
  });

  it("renders the optional description, actions and children", () => {
    render(
      <SurfaceCard
        title="Resumen"
        description="Datos del álbum"
        actions={<button type="button">Editar</button>}
      >
        <p>Contenido</p>
      </SurfaceCard>,
    );

    expect(screen.getByText("Datos del álbum")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.getByText("Contenido")).toBeTruthy();
  });

  it("renders children without a header when no header props are given", () => {
    const { container } = render(
      <SurfaceCard>
        <p>Solo contenido</p>
      </SurfaceCard>,
    );

    expect(container.querySelector("h2")).toBeNull();
    expect(screen.getByText("Solo contenido")).toBeTruthy();
  });

  it("uses the shared surface, border and card radius tokens", () => {
    const { container } = render(<SurfaceCard title="T" />);

    const className = container.querySelector("section")?.className ?? "";
    expect(className).toContain("bg-surface");
    expect(className).toContain("border-border");
    expect(className).toContain("rounded-card");
  });

  it("merges a caller-provided className", () => {
    const { container } = render(<SurfaceCard title="T" className="custom" />);

    expect(container.querySelector("section")?.className).toContain("custom");
  });
});
