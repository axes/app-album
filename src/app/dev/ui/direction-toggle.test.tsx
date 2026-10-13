// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  DIRECTION_STORAGE_KEY,
  DirectionToggle,
  resolveInitialDirection,
} from "./direction-toggle";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.body.innerHTML = "";
});

function renderToggle(stored?: string) {
  document.body.innerHTML = '<main id="dev-ui" data-direction="current"></main>';
  if (stored !== undefined) {
    window.localStorage.setItem(DIRECTION_STORAGE_KEY, stored);
  }
  render(<DirectionToggle />);
}

describe("DirectionToggle", () => {
  it("defaults safely to current for missing or invalid values", () => {
    expect(resolveInitialDirection(null)).toBe("current");
    expect(resolveInitialDirection("invalid")).toBe("current");
    expect(resolveInitialDirection("proposal")).toBe("proposal");
  });

  it("keeps current selected by default", () => {
    renderToggle();
    expect(
      screen.getByRole("button", { name: "Referencia actual" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(document.getElementById("dev-ui")?.dataset.direction).toBe("current");
  });

  it("applies and persists the proposal without touching the theme key", () => {
    window.localStorage.setItem("app-album-theme", "dark");
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: "Propuesta marca" }));

    expect(document.getElementById("dev-ui")?.dataset.direction).toBe("proposal");
    expect(window.localStorage.getItem(DIRECTION_STORAGE_KEY)).toBe("proposal");
    expect(window.localStorage.getItem("app-album-theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Propuesta marca" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
  });

  it("restores a valid stored proposal and exposes 44px targets", () => {
    renderToggle("proposal");
    expect(document.getElementById("dev-ui")?.dataset.direction).toBe("proposal");
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("min-h-[44px]");
    }
  });
});
