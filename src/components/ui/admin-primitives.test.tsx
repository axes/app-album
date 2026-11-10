// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "./data-table";
import { CollapsibleSurfaceCard } from "./collapsible-surface-card";
import { SelectionCheckbox } from "./selection-checkbox";
import { PageHeader } from "./page-header";
import { AdminActionBar } from "@/components/admin/admin-action-bar";
import { AdminSelectionBar } from "@/components/admin/admin-selection-bar";

afterEach(cleanup);

describe("DataTable (Commit 2 — admin foundation)", () => {
  function renderTable(selected = false) {
    return render(
      <DataTable ariaLabel="Álbumes" minWidth="48rem">
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Nombre</DataTableHeaderCell>
            <DataTableHeaderCell>Estado</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          <DataTableRow selected={selected}>
            <DataTableCell>Álbum 1</DataTableCell>
            <DataTableCell>Publicado</DataTableCell>
          </DataTableRow>
        </DataTableBody>
      </DataTable>,
    );
  }

  it("exposes a labelled, focusable scroll region", () => {
    renderTable();
    const region = screen.getByRole("region", { name: "Álbumes" });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.className).toContain("overflow-x-auto");
    expect(region.className).toContain("focus-visible:outline");
  });

  it("keeps semantic table structure and a configurable min width", () => {
    const { container } = renderTable();
    const table = container.querySelector("table") as HTMLTableElement;
    expect(table).toBeTruthy();
    expect(table.style.minWidth).toBe("48rem");
    expect(container.querySelector("thead")).toBeTruthy();
    expect(container.querySelector("tbody")).toBeTruthy();

    const header = screen.getByRole("columnheader", { name: "Nombre" });
    expect(header.getAttribute("scope")).toBe("col");
    expect(header.className).toContain("text-xs");
    expect(header.className).toContain("text-muted");
  });

  it("applies the centralised selected tint only when selected", () => {
    const { unmount } = renderTable(true);
    expect(screen.getByRole("row", { name: /Álbum 1/ }).className).toContain(
      "admin-row-selected",
    );
    unmount();

    renderTable(false);
    expect(
      screen.getByRole("row", { name: /Álbum 1/ }).className,
    ).not.toContain("admin-row-selected");
  });
});

describe("CollapsibleSurfaceCard (Commit 2 — admin foundation)", () => {
  it("starts collapsed with an existing hidden panel controlled by an h3 button", () => {
    render(
      <CollapsibleSurfaceCard title="Láminas" summary="12 elementos">
        <p>Contenido</p>
      </CollapsibleSurfaceCard>,
    );

    const button = screen.getByRole("button", { name: /Láminas/ });
    const heading = screen.getByRole("heading", { level: 3, name: /Láminas/ });
    const panel = screen.getByText("Contenido").parentElement as HTMLElement;

    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(heading.firstElementChild).toBe(button);
    expect(button.parentElement).toBe(heading);
    expect(panel.id).toBe(button.getAttribute("aria-controls"));
    expect(panel.hidden).toBe(true);
  });

  it("toggles the panel and wires aria-controls to the panel id", async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSurfaceCard title="Láminas">
        <p>Contenido</p>
      </CollapsibleSurfaceCard>,
    );

    const button = screen.getByRole("button", { name: /Láminas/ });
    await user.click(button);

    expect(button.getAttribute("aria-expanded")).toBe("true");
    const panel = screen.getByText("Contenido").parentElement as HTMLElement;
    expect(panel.id).toBe(button.getAttribute("aria-controls"));
    expect(panel.hidden).toBe(false);
  });

  it("honours defaultOpen", () => {
    render(
      <CollapsibleSurfaceCard title="Láminas" defaultOpen>
        <p>Contenido</p>
      </CollapsibleSurfaceCard>,
    );

    const panel = screen.getByText("Contenido").parentElement as HTMLElement;
    expect(panel.hidden).toBe(false);
    expect(
      screen.getByRole("button", { name: /Láminas/ }).getAttribute(
        "aria-expanded",
      ),
    ).toBe("true");
  });
});

describe("SelectionCheckbox (Commit 2 — admin foundation)", () => {
  it("renders a 20px checkbox with a 44px target and a visible label", () => {
    render(<SelectionCheckbox label="Seleccionar todo" />);

    const checkbox = screen.getByRole("checkbox", {
      name: "Seleccionar todo",
    }) as HTMLInputElement;
    expect(checkbox.className).toContain("h-5");
    expect(checkbox.className).toContain("w-5");
    expect(checkbox.className).toContain("accent-primary");

    const wrapper = checkbox.closest("label") as HTMLElement;
    expect(wrapper.className).toContain("min-h-11");
    expect(wrapper.className).toContain("min-w-11");
  });

  it("accepts an aria-label when there is no visible label", () => {
    render(<SelectionCheckbox aria-label="Seleccionar fila" />);
    expect(
      screen.getByRole("checkbox", { name: "Seleccionar fila" }),
    ).toBeTruthy();
  });

  it("uses a coherent cursor when disabled", () => {
    render(<SelectionCheckbox label="Seleccionar todo" disabled />);

    const checkbox = screen.getByRole("checkbox", {
      name: "Seleccionar todo",
    }) as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);

    const wrapper = checkbox.closest("label") as HTMLElement;
    expect(wrapper.className).toContain("cursor-not-allowed");
    expect(wrapper.className).not.toContain("cursor-pointer");
  });

  it("throws in development without a label or aria-label", () => {
    const env = process.env as Record<string, string | undefined>;
    const previous = env.NODE_ENV;
    env.NODE_ENV = "development";
    try {
      expect(() => render(<SelectionCheckbox />)).toThrowError(/aria-label/);
    } finally {
      if (previous === undefined) {
        delete env.NODE_ENV;
      } else {
        env.NODE_ENV = previous;
      }
    }
  });
});

describe("AdminActionBar (Commit 2 — admin foundation)", () => {
  it("renders its children and becomes a toolbar when labelled", () => {
    render(
      <AdminActionBar ariaLabel="Acciones de álbumes">
        <button type="button">Nuevo</button>
      </AdminActionBar>,
    );

    expect(
      screen.getByRole("toolbar", { name: "Acciones de álbumes" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nuevo" })).toBeTruthy();
  });

  it("stays a plain container without an aria-label", () => {
    const { container } = render(
      <AdminActionBar>
        <span>Filtros</span>
      </AdminActionBar>,
    );
    expect(container.querySelector('[role="toolbar"]')).toBeNull();
  });
});

describe("AdminSelectionBar (Commit 2 — admin foundation)", () => {
  it("announces the selection count and hosts the bulk actions as a sibling", () => {
    render(
      <AdminSelectionBar count={3}>
        <button type="button">Eliminar seleccionadas</button>
      </AdminSelectionBar>,
    );

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.className).toContain("tabular-nums");
    expect(status.textContent).toContain("3 seleccionadas");
    // The live region wraps only the count text; the actions are a sibling so
    // they are not re-announced on every selection change.
    expect(status.querySelector("button")).toBeNull();
    const action = screen.getByRole("button", {
      name: "Eliminar seleccionadas",
    });
    expect(action).toBeTruthy();
    expect(status.contains(action)).toBe(false);
  });

  it("accepts a custom noun", () => {
    render(<AdminSelectionBar count={2} label="seleccionados" />);
    expect(screen.getByRole("status").textContent).toContain("2 seleccionados");
  });
});

describe("PageHeader back link (Commit 2 — admin foundation)", () => {
  it("renders an optional back link above the title", () => {
    render(
      <PageHeader
        title="Detalle"
        backLink={<a href="#volver">Volver a álbumes</a>}
      />,
    );

    const link = screen.getByRole("link", { name: "Volver a álbumes" });
    expect(link.getAttribute("href")).toBe("#volver");
    // The back link precedes the heading in document order.
    const heading = screen.getByRole("heading", { level: 1, name: "Detalle" });
    expect(
      link.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("Admin state colours (Commit 2 — globals.css source contract)", () => {
  const globals = readFileSync(
    resolve(process.cwd(), "src/app/globals.css"),
    "utf8",
  );

  it("mixes the selected-row tint in srgb with the exact tokens and percentage", () => {
    expect(globals).toContain(
      "color-mix(in srgb, var(--album-primary) 8%, var(--album-surface))",
    );
    expect(globals).not.toContain("color-mix(in oklab");
  });

  it("mixes the danger-ghost hover in srgb with the exact tokens and percentage", () => {
    expect(globals).toContain(
      "color-mix(in srgb, var(--album-danger) 12%, var(--album-surface))",
    );
  });

  it("keeps the DataTable hover on the surface-soft token", () => {
    const dataTable = readFileSync(
      resolve(process.cwd(), "src/components/ui/data-table.tsx"),
      "utf8",
    );
    expect(dataTable).toContain("hover:bg-surface-muted");
  });
});
