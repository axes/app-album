// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";
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

  it("exposes a tablist with aria-selected and a tabpanel when mode is tabs", () => {
    render(
      <SegmentedControl
        items={items}
        value="a"
        onChange={() => undefined}
        ariaLabel="Secciones"
        mode="tabs"
        panelId="panel-1"
        panel={<p>Contenido A</p>}
      />,
    );

    expect(screen.getByRole("tablist", { name: "Secciones" })).toBeTruthy();
    const a = screen.getByRole("tab", { name: "A" });
    const b = screen.getByRole("tab", { name: "B" });
    expect(a.getAttribute("aria-selected")).toBe("true");
    expect(b.getAttribute("aria-selected")).toBe("false");
    expect(a.getAttribute("aria-controls")).toBe("panel-1");
    expect(a.id).toBe("panel-1-tab-a");

    const panel = screen.getByRole("tabpanel");
    expect(panel.id).toBe("panel-1");
    expect(panel.getAttribute("aria-labelledby")).toBe("panel-1-tab-a");
    expect(panel.textContent).toContain("Contenido A");
  });

  it("roves focus with ArrowRight / ArrowLeft and activates automatically", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState("a");
      return (
        <SegmentedControl
          items={items}
          value={value}
          onChange={setValue}
          ariaLabel="Secciones"
          mode="tabs"
          panelId="panel-kb"
          panel={<p>Contenido {value}</p>}
        />
      );
    }
    render(<Harness />);

    const a = screen.getByRole("tab", { name: "A" });
    const b = screen.getByRole("tab", { name: "B" });
    expect(a.getAttribute("tabindex")).toBe("0");
    expect(b.getAttribute("tabindex")).toBe("-1");

    a.focus();
    await user.keyboard("{ArrowRight}");
    expect(b.getAttribute("aria-selected")).toBe("true");
    expect(b.getAttribute("tabindex")).toBe("0");
    expect(a.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(b);
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
      "panel-kb-tab-b",
    );

    await user.keyboard("{ArrowLeft}");
    expect(a.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(a);
  });

  it("wraps around with ArrowRight / ArrowLeft", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState("a");
      return (
        <SegmentedControl
          items={items}
          value={value}
          onChange={setValue}
          ariaLabel="Secciones"
          mode="tabs"
          panelId="panel-wrap"
          panel={<p>Contenido {value}</p>}
        />
      );
    }
    render(<Harness />);

    const a = screen.getByRole("tab", { name: "A" });
    const b = screen.getByRole("tab", { name: "B" });

    a.focus();
    await user.keyboard("{ArrowLeft}");
    expect(b.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(b);

    await user.keyboard("{ArrowRight}");
    expect(a.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(a);
  });

  it("jumps to the first / last tab with Home / End", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState("a");
      return (
        <SegmentedControl
          items={items}
          value={value}
          onChange={setValue}
          ariaLabel="Secciones"
          mode="tabs"
          panelId="panel-home"
          panel={<p>Contenido {value}</p>}
        />
      );
    }
    render(<Harness />);

    const a = screen.getByRole("tab", { name: "A" });
    const b = screen.getByRole("tab", { name: "B" });

    a.focus();
    await user.keyboard("{End}");
    expect(b.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(b);

    await user.keyboard("{Home}");
    expect(a.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(a);
  });

  it("throws in development when tabs mode is used without a panelId", () => {
    const env = process.env as Record<string, string | undefined>;
    const previous = env.NODE_ENV;
    env.NODE_ENV = "development";
    try {
      expect(() =>
        render(
          <SegmentedControl
            items={items}
            value="a"
            onChange={() => undefined}
            ariaLabel="Secciones"
            mode="tabs"
          />,
        ),
      ).toThrowError(/panelId/);
    } finally {
      if (previous === undefined) {
        delete env.NODE_ENV;
      } else {
        env.NODE_ENV = previous;
      }
    }
  });

  it("throws in development when tabs mode is used without a panel", () => {
    const env = process.env as Record<string, string | undefined>;
    const previous = env.NODE_ENV;
    env.NODE_ENV = "development";
    try {
      expect(() =>
        render(
          <SegmentedControl
            items={items}
            value="a"
            onChange={() => undefined}
            ariaLabel="Secciones"
            mode="tabs"
            panelId="panel-1"
          />,
        ),
      ).toThrowError(/panel/);
    } finally {
      if (previous === undefined) {
        delete env.NODE_ENV;
      } else {
        env.NODE_ENV = previous;
      }
    }
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
