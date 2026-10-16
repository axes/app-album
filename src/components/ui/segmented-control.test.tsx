// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl } from "./segmented-control";
import { ViewToggle, type ViewMode } from "@/app/app/albums/[userAlbumId]/view-toggle";

afterEach(cleanup);

const items = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];

describe("SegmentedControl (DESIGN v2 §8)", () => {
  it("renders every item as a toggle button with aria-pressed", () => {
    render(
      <SegmentedControl
        items={items}
        value="a"
        onChange={() => undefined}
        ariaLabel="Selector"
      />,
    );

    const a = screen.getByRole("button", { name: "A" });
    const b = screen.getByRole("button", { name: "B" });
    expect(a.getAttribute("aria-pressed")).toBe("true");
    expect(b.getAttribute("aria-pressed")).toBe("false");
  });

  it("exposes a radiogroup with aria-checked when mode is radio", () => {
    render(
      <SegmentedControl
        items={items}
        value="a"
        onChange={() => undefined}
        ariaLabel="Selector"
        mode="radio"
      />,
    );

    expect(screen.getByRole("radiogroup", { name: "Selector" })).toBeTruthy();
    const a = screen.getByRole("radio", { name: "A" });
    const b = screen.getByRole("radio", { name: "B" });
    expect(a.getAttribute("aria-checked")).toBe("true");
    expect(b.getAttribute("aria-checked")).toBe("false");
  });

  it("uses the container tokens and the 44 px item target", () => {
    const { container } = render(
      <SegmentedControl
        items={items}
        value="a"
        onChange={() => undefined}
        ariaLabel="Selector"
      />,
    );

    const group = container.querySelector('[aria-label="Selector"]') as HTMLElement;
    expect(group).toBeTruthy();
    expect(group.className).toContain("rounded-pill");
    expect(group.className).toContain("border-border");
    expect(group.className).toContain("bg-surface-muted");
    expect(group.className).toContain("p-1");

    for (const button of screen.getAllByRole("button")) {
      const className = button.className;
      expect(className).toContain("min-h-11");
      expect(className).toContain("rounded-pill");
      expect(className).toContain("text-sm");
      expect(className).toContain("font-semibold");
    }
  });

  it("marks the selected item with the primary background and text-on", () => {
    render(
      <SegmentedControl
        items={items}
        value="a"
        onChange={() => undefined}
        ariaLabel="Selector"
      />,
    );

    const selected = screen.getByRole("button", { name: "A" });
    expect(selected.className).toContain("bg-primary");
    expect(selected.className).toContain("text-on");
  });

  it("invokes onChange with the clicked value", async () => {
    const user = userEvent.setup();
    let captured: string | null = null;
    render(
      <SegmentedControl
        items={items}
        value="a"
        onChange={(value) => {
          captured = value;
        }}
        ariaLabel="Selector"
      />,
    );

    await user.click(screen.getByRole("button", { name: "B" }));
    expect(captured).toBe("b");
  });

  it("renders an optional leading icon per item", () => {
    const { container } = render(
      <SegmentedControl
        items={[
          { value: "g", label: "G", icon: "grid" },
          { value: "l", label: "L", icon: "list" },
        ]}
        value="g"
        onChange={() => undefined}
        ariaLabel="Vista"
      />,
    );

    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(2);
  });
});

describe("ViewToggle (DESIGN v2 §8, preserved contract)", () => {
  it("keeps the Mosaico/Lista options and their aria-pressed contract", () => {
    render(<ViewToggle value="grid" onChange={() => undefined} />);

    const mosaic = screen.getByRole("button", { name: "Mosaico" });
    const list = screen.getByRole("button", { name: "Lista" });
    expect(mosaic.getAttribute("aria-pressed")).toBe("true");
    expect(list.getAttribute("aria-pressed")).toBe("false");
    expect(mosaic.className).toContain("min-h-11");
    expect(list.className).toContain("min-h-11");
    // Buttons must not match the daisyUI `.btn` selector — they live in
    // their own primitive now.
    expect(mosaic.className).not.toContain(" btn ");
  });

  it("emits the chosen mode when Lista is clicked", async () => {
    const user = userEvent.setup();
    const calls: ViewMode[] = [];
    const onChange = (v: ViewMode) => {
      calls.push(v);
    };
    render(<ViewToggle value="grid" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Lista" }));
    expect(calls).toEqual(["list"]);
  });
});
