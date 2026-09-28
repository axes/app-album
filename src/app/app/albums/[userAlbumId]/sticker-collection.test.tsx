// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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
      { id: "sticker-2", code: "ESP-01", name: "Logo especial", position: 3, quantity: 2 },
      { id: "sticker-3", code: "LOGO", name: "Nombre largo", position: 4, quantity: 3 },
    ],
  },
];

function renderCollection() {
  return render(<StickerCollection groups={groups} userAlbumId="collection-1" />);
}

describe("StickerCollection", () => {
  it("starts in mosaic view and renders codes, optional names, and quantity states", () => {
    renderCollection();

    expect(screen.getByRole("button", { name: "▦ Mosaico" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "☷ Lista" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Página 1 — 3 / 4")).toBeTruthy();
    expect(screen.getByText("004")).toBeTruthy();
    expect(screen.getByText("Creeper")).toBeTruthy();
    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(screen.getByText("Obtenida")).toBeTruthy();
    expect(screen.getByText("1 repetida")).toBeTruthy();
    expect(screen.getByText("2 repetidas")).toBeTruthy();
  });

  it("switches to the existing compact list and back without changing data", async () => {
    const user = userEvent.setup();
    renderCollection();

    await user.click(screen.getByRole("button", { name: "☷ Lista" }));
    expect(screen.getByRole("button", { name: "☷ Lista" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("ESP-01")).toBeTruthy();
    expect(screen.getByText("Logo especial")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "▦ Mosaico" }));
    expect(screen.getByRole("button", { name: "▦ Mosaico" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("submits the existing increment action when a missing tile is activated", async () => {
    const user = userEvent.setup();
    renderCollection();

    await user.click(screen.getByRole("button", { name: "Marcar lámina 004 como obtenida" }));

    await waitFor(() => expect(mocks.adjustQuantityAction).toHaveBeenCalledTimes(1));
    const formData = mocks.adjustQuantityAction.mock.calls[0][0] as FormData;
    expect(formData.get("userAlbumId")).toBe("collection-1");
    expect(formData.get("stickerId")).toBe("sticker-0");
    expect(formData.get("change")).toBe("increment");
  });

  it("offers decrement and increment controls only after a sticker is obtained", () => {
    renderCollection();

    const missingTile = screen.getByRole("button", { name: "Marcar lámina 004 como obtenida" });
    expect(within(missingTile).queryByText("−")).toBeNull();
    expect(screen.getByRole("button", { name: "Quitar copia de A1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Añadir copia de A1" })).toBeTruthy();
    expect(screen.getByLabelText("1 copias")).toBeTruthy();
  });
});
