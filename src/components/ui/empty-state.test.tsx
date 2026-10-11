// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";

afterEach(cleanup);

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="Sin álbumes" />);

    expect(screen.getByText("Sin álbumes")).toBeTruthy();
  });

  it("renders the optional description, action and icon", () => {
    render(
      <EmptyState
        title="Sin álbumes"
        description="Explora el catálogo"
        icon={<span>📚</span>}
        action={<a href="#explorar">Explorar</a>}
      />,
    );

    expect(screen.getByText("Explora el catálogo")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Explorar" })).toBeTruthy();
    expect(screen.getByText("📚")).toBeTruthy();
  });

  it("hides the decorative icon from assistive technology", () => {
    const { container } = render(
      <EmptyState title="T" icon={<span>📚</span>} />,
    );

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("omits the optional parts when they are not provided", () => {
    const { container } = render(<EmptyState title="Solo título" />);

    expect(container.firstElementChild?.textContent).toBe("Solo título");
  });

  it("merges a caller-provided className", () => {
    const { container } = render(<EmptyState title="T" className="custom" />);

    expect(container.firstElementChild?.className).toContain("custom");
  });
});
