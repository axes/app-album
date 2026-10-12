// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound,
  redirect: vi.fn(),
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <span data-testid="theme-toggle">theme</span>,
}));

describe("/dev/ui UI-04A.3", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders the compact editorial header and same-origin download", async () => {
    const { default: Page } = await import("./page");
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: /propuesta de diseño/i })).toBeTruthy();
    expect(screen.getByRole("img", { name: /placeholder de identidad app álbum/i })).toBeTruthy();
    expect(screen.getByRole("group", { name: /dirección visual/i })).toBeTruthy();
    expect(screen.getByTestId("theme-toggle")).toBeTruthy();
    const download = screen.getByRole("link", { name: /descargar referencia/i });
    expect(download.getAttribute("href")).toBe("/dev/ui/download");
    expect(download.getAttribute("download")).not.toBeNull();
  });

  it("renders all planned editorial sections", async () => {
    const { default: Page } = await import("./page");
    render(<Page />);
    for (const name of [
      "Qué cambia respecto a la referencia",
      "Paleta",
      "Tipografía",
      "Radios y sombras",
      "Botones y campos",
      "Mensajes y badges",
      "Componentes del álbum",
      "Estado vacío y navegación móvil",
      "Movimiento",
    ]) {
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    }
  });

  it("renders 24 accessible sticker slots and the four foil positions", async () => {
    const { default: Page } = await import("./page");
    const { container } = render(<Page />);
    const stickers = container.querySelectorAll("button.sticker");
    expect(stickers).toHaveLength(24);
    expect(container.querySelectorAll("button.sticker-foil")).toHaveLength(4);
    for (const number of [1, 8, 16, 24]) {
      expect(container.querySelector(`button.sticker-foil[aria-label^="Lámina ${number} "]`)).toBeTruthy();
    }
    expect(within(stickers[2] as HTMLElement).getByText("×2")).toBeTruthy();
  });

  it("cycles sticker state locally and updates counters, progress and filters", async () => {
    const { default: Page } = await import("./page");
    render(<Page />);
    const missing = screen.getByRole("button", { name: "Lámina 5, me falta" });
    fireEvent.click(missing);
    expect(screen.getByRole("button", { name: "Lámina 5, pegada" })).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "71% completado" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Lámina 5, pegada" }));
    expect(screen.getByRole("button", { name: "Lámina 5, repetida" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Lámina 5, repetida" }));
    expect(screen.getByRole("button", { name: "Lámina 5, me falta" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Me faltan" }));
    expect(screen.getByRole("button", { name: "Lámina 5, me falta" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lámina 1 especial, pegada" })).toBeNull();
  });

  it("includes circular and linear progress with complete ARIA values", async () => {
    const { default: Page } = await import("./page");
    render(<Page />);
    const progress = screen.getAllByRole("progressbar");
    expect(progress.length).toBeGreaterThanOrEqual(6);
    expect(progress.some((item) => item.getAttribute("aria-valuenow") === "67")).toBe(true);
    expect(progress.some((item) => item.getAttribute("aria-valuenow") === "100")).toBe(true);
  });

  it("reuses the simple identity placeholder in header and empty state", async () => {
    const { default: Page } = await import("./page");
    const { container } = render(<Page />);
    expect(container.querySelectorAll(".proposal-identity-placeholder")).toHaveLength(2);
    expect(container.querySelector(".proposal-brand svg")).toBeNull();
    expect(container.querySelector(".proposal-empty svg")).toBeNull();
  });

  it("renders messages with SVG, empty state and four-link mobile nav", async () => {
    const { default: Page } = await import("./page");
    const { container } = render(<Page />);
    expect(container.querySelectorAll(".proposal-alert svg")).toHaveLength(3);
    expect(screen.getByText("Aún no tienes láminas")).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: /navegación inferior/i });
    expect(within(nav).getAllByRole("link")).toHaveLength(4);
    expect(within(nav).getByRole("link", { name: /álbum/i }).getAttribute("aria-current")).toBe("page");
  });

  it("keeps proposal isolated and emits token-driven styles without concrete colours", async () => {
    const { default: Page } = await import("./page");
    const { container } = render(<Page />);
    const main = container.querySelector("main");
    expect(main?.getAttribute("data-direction")).toBe("current");
    expect(container.querySelector('[data-showcase="proposal"]')).toBeTruthy();
    expect(container.innerHTML).not.toMatch(/href="\/(app|admin|share)/);
    // Concrete values rendered here are injected from scripts/ui-tokens.ts;
    // centralization.test.ts guards that this component source owns no literals.
    expect(container.innerHTML).toContain("var(--album-proposal-primary)");
  });

  it("fails closed outside development and Vercel Preview", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: Page } = await import("./page");
    expect(() => Page()).toThrow("NEXT_NOT_FOUND");
    expect(navigationMocks.notFound).toHaveBeenCalled();
  });
});
