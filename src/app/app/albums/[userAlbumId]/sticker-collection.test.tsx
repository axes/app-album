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
  it("starts in the accessible mosaic view with a collapsed section", () => {
    renderCollection();

    const mosaic = screen.getByRole("button", { name: "▦ Mosaico" });
    expect(mosaic.getAttribute("aria-pressed")).toBe("true");
    expect(mosaic.className).toContain("min-h-11");
    expect(screen.getByRole("button", { name: "☷ Lista" }).getAttribute("aria-pressed")).toBe("false");
    const summary = screen.getByText("Página 1").closest("summary");
    expect(summary?.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText("3 / 4")).toBeTruthy();
    expect(screen.getByText("Colapsada")).toBeTruthy();
  });

  it("opens and closes a section while exposing all quantity-derived states", async () => {
    const user = userEvent.setup();
    renderCollection();
    const summary = screen.getByText("Página 1").closest("summary") as HTMLElement;

    await user.click(summary);
    expect(summary.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Expandida")).toBeTruthy();
    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(screen.getByText("Obtenida")).toBeTruthy();
    expect(screen.getAllByText("Repetida")).toHaveLength(2);
    expect(screen.getByText("×2")).toBeTruthy();
    expect(screen.queryByText("Especial")).toBeNull();

    await user.click(summary);
    expect(summary.getAttribute("aria-expanded")).toBe("false");
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
    expect(screen.getByLabelText("1 copias")).toBeTruthy();
  });

  it("renders the designed empty state", () => {
    render(<StickerCollection groups={[]} userAlbumId="collection-1" />);
    expect(screen.getByText("No hay láminas")).toBeTruthy();
  });
});
