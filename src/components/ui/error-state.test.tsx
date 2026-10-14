// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ErrorState } from "./error-state";

afterEach(cleanup);

describe("ErrorState (UI-06B)", () => {
  it("renders the title as the document's main heading", () => {
    render(<ErrorState title="Algo salió mal" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Algo salió mal");
  });

  it("renders the optional description", () => {
    render(
      <ErrorState title="Algo salió mal" description="Puedes intentar nuevamente." />,
    );

    expect(screen.getByText("Puedes intentar nuevamente.")).toBeTruthy();
  });

  it("renders the actions", () => {
    render(
      <ErrorState
        title="Algo salió mal"
        actions={<button type="button">Reintentar</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
  });

  it("exposes exactly one live region and it carries the message", () => {
    const { container } = render(
      <ErrorState
        title="Algo salió mal"
        description="Puedes intentar nuevamente."
        actions={<button type="button">Reintentar</button>}
      />,
    );

    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].textContent).toContain("Algo salió mal");
    expect(alerts[0].textContent).toContain("Puedes intentar nuevamente.");
  });

  it("keeps the interactive actions outside the live region", () => {
    const { container } = render(
      <ErrorState
        title="Algo salió mal"
        actions={<button type="button">Reintentar</button>}
      />,
    );

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.querySelector("button")).toBeNull();
    expect(container.querySelector("button")).not.toBeNull();
  });

  it("omits the optional parts when they are not provided", () => {
    const { container } = render(<ErrorState title="Solo título" />);

    expect(container.querySelector("p")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
    expect(container.firstElementChild?.textContent).toBe("Solo título");
  });

  it("merges a caller-provided className", () => {
    const { container } = render(<ErrorState title="T" className="custom" />);

    expect(container.firstElementChild?.className).toContain("custom");
  });
});
