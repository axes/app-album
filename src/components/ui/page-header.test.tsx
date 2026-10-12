// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PageHeader } from "./page-header";

afterEach(cleanup);

describe("PageHeader", () => {
  it("renders the title as a level-1 heading", () => {
    render(<PageHeader title="Mis álbumes" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Mis álbumes" }),
    ).toBeTruthy();
  });

  it("renders the optional description and metadata", () => {
    render(
      <PageHeader
        title="Mis álbumes"
        description="Colección de erin"
        metadata={<span>3 álbumes</span>}
      />,
    );

    expect(screen.getByText("Colección de erin")).toBeTruthy();
    expect(screen.getByText("3 álbumes")).toBeTruthy();
  });

  it("renders the actions slot", () => {
    render(
      <PageHeader
        title="Álbumes"
        actions={<button type="button">Nuevo</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Nuevo" })).toBeTruthy();
  });

  it("omits the optional parts when they are not provided", () => {
    const { container } = render(<PageHeader title="Solo título" />);

    expect(container.querySelector("header")?.textContent).toBe("Solo título");
  });

  it("applies the entrance utility and merges className", () => {
    const { container } = render(<PageHeader title="T" className="custom" />);

    const header = container.querySelector("header");
    expect(header?.className).toContain("animate-enter");
    expect(header?.className).toContain("custom");
  });
});
