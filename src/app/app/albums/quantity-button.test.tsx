// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFormStatus } from "react-dom";
import { QuantityButton } from "./quantity-button";
import { Icon } from "@/components/ui/icons";

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");

  return {
    ...actual,
    useFormStatus: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("QuantityButton", () => {
  it("centers a 20 px action icon within its minimum touch target", () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: false } as never);

    render(
      <form>
        <QuantityButton label="Añadir copia">
          <Icon className="block shrink-0" name="add" size="md" />
        </QuantityButton>
      </form>,
    );

    const button = screen.getByRole("button", { name: "Añadir copia" });
    const icon = button.querySelector("svg");

    expect(
      ["inline-flex", "items-center", "justify-center", "min-h-11", "min-w-11"].every(
        (className) => button.classList.contains(className),
      ),
    ).toBe(true);
    expect(icon?.getAttribute("width")).toBe("20");
    expect(icon?.getAttribute("height")).toBe("20");
    expect(icon?.classList.contains("block")).toBe(true);
    expect(icon?.classList.contains("shrink-0")).toBe(true);
  });

  it("replaces the action icon with the centered 20 px loading icon while pending", () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: true } as never);

    render(
      <form>
        <QuantityButton label="Quitar copia">
          <Icon data-testid="action-icon" name="remove" size="md" />
        </QuantityButton>
      </form>,
    );

    const button = screen.getByRole("button", { name: "Quitar copia" });
    const icon = button.querySelector("svg");

    expect(button.hasAttribute("disabled")).toBe(true);
    expect(screen.queryByTestId("action-icon")).toBeNull();
    expect(icon?.getAttribute("width")).toBe("20");
    expect(icon?.getAttribute("height")).toBe("20");
    expect(icon?.classList.contains("block")).toBe(true);
    expect(icon?.classList.contains("shrink-0")).toBe(true);
  });
});
