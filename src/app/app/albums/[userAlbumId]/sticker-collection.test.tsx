// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  adjustQuantityAction: vi.fn(async () => undefined),
}));

vi.mock("../actions", () => ({
  adjustQuantityAction: mocks.adjustQuantityAction,
}));

import { StickerCollection } from "./sticker-collection";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const groups = [
  {
    id: "page-1",
    name: "Página 1",
    stickers: [
      { id: "sticker-0", code: "004", name: "Creeper", position: 1, quantity: 0 },
      { id: "sticker-1", code: "A1", name: null, position: 2, quantity: 1 },
      { id: "sticker-2", code: "ESP-01", name: "Logo", position: 3, quantity: 2 },
      { id: "sticker-3", code: "MAX", name: "Límite", position: 4, quantity: 1000 },
    ],
  },
];

function renderCollection() {
  return render(<StickerCollection groups={groups} userAlbumId="collection-1" />);
}

describe("StickerCollection", () => {
  it("starts in the accessible mosaic view with the first section open", () => {
    renderCollection();

    const mosaic = screen.getByRole("button", { name: "▦ Mosaico" });
    expect(mosaic.getAttribute("aria-pressed")).toBe("true");
    expect(mosaic.className).toContain("min-h-11");
    expect(screen.getByRole("button", { name: "☷ Lista" }).getAttribute("aria-pressed")).toBe("false");
    const summary = screen.getByText("Página 1").closest("summary");
    expect(summary?.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("3 / 4")).toBeTruthy();
    expect(screen.getByText("Expandida")).toBeTruthy();
  });

  it("opens only the first section when several groups exist", () => {
    const secondPage = groups[0].stickers.map((sticker) => ({ ...sticker, id: `${sticker.id}-b` }));
    render(
      <StickerCollection
        groups={[
          { id: "page-1", name: "Página 1", stickers: groups[0].stickers },
          { id: "page-2", name: "Página 2", stickers: secondPage },
        ]}
        userAlbumId="collection-1"
      />,
    );

    expect(screen.getByText("Página 1").closest("summary")?.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Página 2").closest("summary")?.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes and reopens a section while exposing all quantity-derived states", async () => {
    const user = userEvent.setup();
    renderCollection();
    const summary = screen.getByText("Página 1").closest("summary") as HTMLElement;

    expect(summary.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(screen.getByText("Obtenida")).toBeTruthy();
    expect(screen.getByText("Repetida · 2 copias")).toBeTruthy();
    expect(screen.getByText("Repetida · 1000 copias")).toBeTruthy();
    expect(screen.queryByText("Especial")).toBeNull();

    await user.click(summary);
    expect(summary.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText("Colapsada")).toBeTruthy();

    await user.click(summary);
    expect(summary.getAttribute("aria-expanded")).toBe("true");
  });

  it("switches to the existing compact list and back without changing data", async () => {
    const user = userEvent.setup();
    renderCollection();

    await user.click(screen.getByRole("button", { name: "☷ Lista" }));
    expect(screen.getByRole("button", { name: "☷ Lista" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("ESP-01")).toBeTruthy();
    expect(screen.getByText("Logo")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "▦ Mosaico" }));
    expect(screen.getByRole("button", { name: "▦ Mosaico" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("preserves increment and decrement payloads with exact accessible labels", async () => {
    const user = userEvent.setup();
    renderCollection();

    const add = screen.getByRole("button", { name: "Añadir copia de lámina 004" });
    const remove = screen.getByRole("button", { name: "Quitar copia de lámina A1" });
    expect(add.className).toContain("min-h-11");
    expect(add.className).toContain("min-w-11");
    expect(screen.getByRole("button", { name: "Quitar copia de lámina 004" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Añadir copia de lámina MAX" }).hasAttribute("disabled")).toBe(true);

    await user.click(add);
    await waitFor(() => expect(mocks.adjustQuantityAction).toHaveBeenCalledTimes(1));
    let formData = mocks.adjustQuantityAction.mock.calls[0][0] as FormData;
    expect(Object.fromEntries(formData)).toEqual({ userAlbumId: "collection-1", stickerId: "sticker-0", change: "increment" });

    await user.click(remove);
    await waitFor(() => expect(mocks.adjustQuantityAction).toHaveBeenCalledTimes(2));
    formData = mocks.adjustQuantityAction.mock.calls[1][0] as FormData;
    expect(Object.fromEntries(formData)).toEqual({ userAlbumId: "collection-1", stickerId: "sticker-1", change: "decrement" });
    expect(screen.getByText("Obtenida")).toBeTruthy();
  });

  it("lays the mosaic out with an auto-fill grid and full-width quantity targets", () => {
    renderCollection();

    const list = screen.getByRole("list");
    expect(list.className).toContain("grid-cols-[repeat(auto-fill,minmax(7rem,1fr))]");

    const add = screen.getByRole("button", { name: "Añadir copia de lámina 004" });
    expect(add.className).toContain("min-h-11");
    expect(add.className).toContain("min-w-11");
    expect(add.className).toContain("w-full");
  });

  it("derives the card surface and border from the sticker state token", () => {
    renderCollection();

    const missing = screen.getByText("004").closest("li") as HTMLElement;
    expect(missing.className).toContain("border-dashed");
    expect(missing.className).toContain("bg-surface-muted");
    expect(missing.getAttribute("style")).toBeNull();

    const owned = screen.getByText("A1").closest("li") as HTMLElement;
    expect(owned.getAttribute("style")).toContain("var(--album-sticker-owned)");

    const duplicate = screen.getByText("ESP-01").closest("li") as HTMLElement;
    expect(duplicate.getAttribute("style")).toContain("var(--album-sticker-duplicate)");
    expect(duplicate.getAttribute("style")).toContain("color-mix");
  });

  it("renders the designed empty state", () => {
    render(<StickerCollection groups={[]} userAlbumId="collection-1" />);
    expect(screen.getByText("No hay láminas")).toBeTruthy();
  });
});
