// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));
vi.mock("next/navigation", () => ({ notFound: navigationMocks.notFound, redirect: vi.fn() }));
vi.mock("next/font/google", () => ({
  Manrope: () => ({ variable: "manrope-variable" }),
  DM_Sans: () => ({ variable: "dm-sans-variable" }),
}));

describe("/dev/ui UI-07B Visual Reference Lab", () => {
  beforeEach(() => { vi.resetModules(); vi.stubEnv("NODE_ENV", "development"); });
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

  it("renders local selectors and all combinations on one showcase", async () => {
    const { default: Page } = await import("./page");
    const { container } = render(<Page />);
    const main = container.querySelector("#dev-ui")!;
    expect(main.getAttribute("data-direction")).toBe("current");
    expect(main.getAttribute("data-theme")).toBe("light");
    expect(main.getAttribute("data-typography")).toBe("manrope");
    for (const [direction, directionLabel] of [["current", "Actual"], ["candidate", "Candidata"]] as const) {
      for (const [theme, themeLabel] of [["light", "Light"], ["dark", "Dark"]] as const) {
        fireEvent.click(screen.getByRole("button", { name: directionLabel }));
        fireEvent.click(screen.getByRole("button", { name: themeLabel }));
        expect(main.getAttribute("data-direction")).toBe(direction);
        expect(main.getAttribute("data-theme")).toBe(theme);
      }
    }
    fireEvent.click(screen.getByRole("button", { name: "B · DM Sans + Manrope" }));
    expect(main.getAttribute("data-typography")).toBe("editorial");
    expect(container.querySelector("style")?.textContent).toContain(
      "--lab-body:var(--lab-font-dm-sans);--lab-heading:var(--lab-font-manrope)",
    );
    expect(container.querySelectorAll("main#dev-ui")).toHaveLength(1);
  });

  it("loads both scoped Google font variables", async () => {
    const { default: Page } = await import("./page");
    const { container } = render(<Page />);
    expect(container.querySelector("main")?.className).toContain("manrope-variable");
    expect(container.querySelector("main")?.className).toContain("dm-sans-variable");
  });

  it("covers the required lab sections without a snapshot", async () => {
    const { default: Page } = await import("./page");
    render(<Page />);
    for (const name of ["Foundations", "Typography", "Spacing, radius, shadows & glow", "Buttons", "Forms", "Feedback", "Album", "Stickers", "Navigation", "Dialogs", "Achievement"]) {
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    }
    expect(screen.getByText(/Álbum completado 100%/)).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Progreso Mundial 2026" }).getAttribute("aria-valuenow")).toBe("63");
  });

  it("has labelled controls, 44px target rules and complete form states", async () => {
    const { default: Page } = await import("./page");
    const { container } = render(<Page />);
    expect(screen.getByRole("group", { name: "Dirección" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Tema" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Tipografía" })).toBeTruthy();
    expect(screen.getByLabelText("Nombre")).toBeTruthy();
    expect(screen.getByLabelText("Categoría")).toBeTruthy();
    expect(screen.getByLabelText("Notas")).toBeTruthy();
    expect(screen.getByLabelText("Bloqueado").hasAttribute("disabled")).toBe(true);
    expect(container.querySelector("style")?.textContent).toContain("min-height:44px");
    expect(container.querySelector("style")?.textContent).toContain("prefers-reduced-motion:reduce");
    const focusDemo = screen.getByRole("button", { name: "Focus" });
    expect(focusDemo.className).toContain("is-focus-demo");
    expect(focusDemo.hasAttribute("autofocus")).toBe(false);
    expect(screen.getByText(/Candidata no aprobada/i)).toBeTruthy();
  });

  it("keeps sticker interactions and dialogs local", async () => {
    const { default: Page } = await import("./page");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: "Lámina 5, me falta" }));
    expect(screen.getByRole("button", { name: "Lámina 5, pegada" })).toBeTruthy();

    const trigger = screen.getByRole("button", { name: "Eliminar álbum…" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "¿Eliminar este álbum?" });
    expect(within(dialog).getByText(/no modifica ningún dato/i)).toBeTruthy();
    expect(document.activeElement).toBe(
      within(dialog).getByRole("button", { name: "Cancelar" }),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("is isolated from product theme, storage and product routes", async () => {
    const { default: Page } = await import("./page");
    const { container } = render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(document.body.hasAttribute("data-theme")).toBe(false);
    expect(container.innerHTML).not.toContain("localStorage");
    expect(container.innerHTML).not.toMatch(/href="\/(app|admin|share)/);
  });

  it("fails closed outside development and Vercel Preview", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("VERCEL_ENV", "production");
    const { default: Page } = await import("./page");
    expect(() => Page()).toThrow("NEXT_NOT_FOUND");
    expect(navigationMocks.notFound).toHaveBeenCalled();
  });
});
