// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => {
  const stops: Array<ReturnType<typeof vi.fn>> = [];
  return {
    stops,
    adjustQuantityAction: vi.fn(async () => undefined),
    animate: vi.fn(() => {
      const stop = vi.fn();
      stops.push(stop);
      return { stop };
    }),
  };
});

vi.mock("../actions", () => ({
  adjustQuantityAction: mocks.adjustQuantityAction,
}));

// jsdom 29.1.1 has no `Element.prototype.animate`, so Motion's `animate()` is
// replaced wholesale. This exercises our own decision logic (when and with
// which intent we animate), never Motion's internals.
vi.mock("motion/react", () => ({
  animate: mocks.animate,
}));

import { stubMatchMedia } from "@/test/stubs/match-media";
import { StickerCard } from "./sticker-card";
import { CLEAR_MS, OPTIMISTIC_TIMEOUT_MS } from "./sticker-interaction";

beforeEach(() => {
  stubMatchMedia(false);
  mocks.adjustQuantityAction.mockImplementation(async () => undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  mocks.stops.length = 0;
});

function sticker(quantity: number) {
  return { id: "sticker-1", code: "004", name: "Creeper", position: 1, quantity };
}

function renderCard(quantity: number, view: "grid" | "list" = "grid") {
  return render(<StickerCard sticker={sticker(quantity)} userAlbumId="collection-1" view={view} />);
}

function rerenderCard(rerender: (ui: React.ReactElement) => void, quantity: number, view: "grid" | "list" = "grid") {
  rerender(<StickerCard sticker={sticker(quantity)} userAlbumId="collection-1" view={view} />);
}

const addButton = () => screen.getByRole("button", { name: "Añadir copia de lámina 004" });
const removeButton = () => screen.getByRole("button", { name: "Quitar copia de lámina 004" });
const particles = () => document.querySelectorAll(".sticker-burst-particle").length;
const ghosts = () => document.querySelectorAll(".sticker-ghost").length;

/**
 * Timer-driven tests use `fireEvent` rather than `userEvent`: `userEvent`
 * schedules its own delays through the faked clock, which deadlocks the test
 * unless every internal wait is advanced by hand. `fireEvent` dispatches the
 * click synchronously, which is all these assertions need.
 */
function click(element: HTMLElement) {
  fireEvent.click(element);
}

describe("StickerCard valid intent source", () => {
  it("stays missing after rendering and waiting", async () => {
    renderCard(0);

    await waitFor(() => expect(screen.getByText("Faltante")).toBeTruthy());

    expect(screen.queryByText("Obtenida")).toBeNull();
    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("does not change when the card is clicked outside its controls", () => {
    renderCard(0);
    const card = screen.getByText("Faltante").closest("li");
    expect(card).not.toBeNull();

    fireEvent.click(card!);

    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("does not change when the form itself is clicked outside the button", () => {
    renderCard(0);
    const form = addButton().closest("form");
    expect(form).not.toBeNull();

    fireEvent.click(form!);

    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("does not change when the add button receives focus", () => {
    renderCard(0);

    addButton().focus();

    expect(document.activeElement).toBe(addButton());
    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("does not change on card or button hover", async () => {
    const user = userEvent.setup();
    renderCard(0);
    const card = screen.getByText("Faltante").closest("li");
    expect(card).not.toBeNull();

    await user.hover(card!);
    await user.hover(addButton());

    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("changes from missing to obtained only after a valid add click", async () => {
    const user = userEvent.setup();
    renderCard(0);

    await user.click(addButton());

    expect(screen.getByText("Obtenida")).toBeTruthy();
  });

  it("ignores a click on the disabled decrement button", async () => {
    const user = userEvent.setup();
    renderCard(0);

    expect((removeButton() as HTMLButtonElement).disabled).toBe(true);
    await user.click(removeButton());

    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("does not increment optimistically again while the form is pending", async () => {
    mocks.adjustQuantityAction.mockImplementation(() => new Promise<void>(() => {}));
    const user = userEvent.setup();
    renderCard(0);

    await user.click(addButton());
    expect(screen.getByText("Obtenida")).toBeTruthy();
    await waitFor(() => expect((addButton() as HTMLButtonElement).disabled).toBe(true));

    await user.click(addButton());

    expect(screen.getByText("Obtenida")).toBeTruthy();
    expect(screen.queryByText("Repetida · 2 copias")).toBeNull();
  });

  it("does not change on initial render or rerender with the same prop", () => {
    const { rerender } = renderCard(0);

    rerenderCard(rerender, 0);

    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("does not create optimistic state when a section is opened or closed", () => {
    const { unmount } = renderCard(0);

    // Closing a section unmounts the card; opening it mounts the same server
    // value again. Neither lifecycle step is a quantity intent.
    unmount();
    renderCard(0);

    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("does not create optimistic state when switching between grid and list", () => {
    const { rerender } = renderCard(0, "grid");

    rerenderCard(rerender, 0, "list");
    expect(screen.getByText("Faltante")).toBeTruthy();

    rerenderCard(rerender, 0, "grid");
    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(mocks.animate).not.toHaveBeenCalled();
  });
});

describe("StickerCard interaction feedback", () => {
  it("celebrates the first copy with a burst and a card pop", async () => {
    const user = userEvent.setup();
    renderCard(0);

    await user.click(addButton());

    expect(mocks.animate).toHaveBeenCalled();
    expect(particles()).toBe(6);
    expect(screen.getByText("Obtenida")).toBeTruthy();
  });

  it("celebrates the first duplicate with a ghost and no particles", async () => {
    const user = userEvent.setup();
    renderCard(1);

    await user.click(addButton());

    expect(mocks.animate).toHaveBeenCalled();
    expect(ghosts()).toBe(1);
    expect(particles()).toBe(0);
    expect(screen.getByText("Repetida · 2 copias")).toBeTruthy();
  });

  it("uses a reduced pulse for further duplicates", async () => {
    const user = userEvent.setup();
    renderCard(2);

    await user.click(addButton());

    expect(mocks.animate).toHaveBeenCalledTimes(1);
    expect(mocks.animate.mock.calls[0][0]).toBe(screen.getByText("Repetida · 3 copias"));
    expect(particles()).toBe(0);
    expect(ghosts()).toBe(0);
    expect(screen.getByText("Repetida · 3 copias")).toBeTruthy();
  });

  it("does not celebrate when a duplicate drops back to a single copy", async () => {
    const user = userEvent.setup();
    renderCard(2);

    await user.click(removeButton());

    expect(mocks.animate).not.toHaveBeenCalled();
    expect(particles()).toBe(0);
    expect(screen.getByText("Obtenida")).toBeTruthy();
  });

  it("acknowledges a loss discreetly without celebrating", async () => {
    const user = userEvent.setup();
    renderCard(1);

    await user.click(removeButton());

    expect(particles()).toBe(0);
    expect(ghosts()).toBe(0);
    expect(screen.getByText("Faltante")).toBeTruthy();
  });

  it("animates nothing on the initial render", () => {
    renderCard(0);

    expect(mocks.animate).not.toHaveBeenCalled();
    expect(particles()).toBe(0);
    expect(ghosts()).toBe(0);
  });

  it("animates nothing when a new quantity arrives from the server", () => {
    const { rerender } = renderCard(0);

    rerenderCard(rerender, 1);

    expect(mocks.animate).not.toHaveBeenCalled();
    expect(particles()).toBe(0);
    expect(ghosts()).toBe(0);
    expect(screen.getByText("Obtenida")).toBeTruthy();
  });

  it("does not accumulate intent or animation from repeated clicks while pending", async () => {
    mocks.adjustQuantityAction.mockImplementation(() => new Promise<void>(() => {}));
    const user = userEvent.setup();
    renderCard(0);

    await user.click(addButton());
    expect(screen.getByText("Obtenida")).toBeTruthy();
    expect(particles()).toBe(6);
    await waitFor(() => expect((addButton() as HTMLButtonElement).disabled).toBe(true));

    await user.click(addButton());
    await user.click(addButton());

    expect(screen.getByText("Obtenida")).toBeTruthy();
    expect(screen.queryByText("Repetida · 2 copias")).toBeNull();
    expect(mocks.animate).toHaveBeenCalledTimes(2);
    expect(particles()).toBe(6);
  });

  it("skips every decorative effect under reduced motion", async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    renderCard(0);

    await user.click(addButton());

    expect(mocks.animate).not.toHaveBeenCalled();
    expect(particles()).toBe(0);
    expect(ghosts()).toBe(0);
    expect(screen.getByText("Obtenida")).toBeTruthy();
  });

  it("stops the running animation when the card unmounts", async () => {
    const user = userEvent.setup();
    const { unmount } = renderCard(0);

    await user.click(addButton());
    unmount();

    expect(mocks.stops.some((stop) => stop.mock.calls.length > 0)).toBe(true);
  });

  it("reconciles the optimistic value with the server value", async () => {
    const user = userEvent.setup();
    const { rerender } = renderCard(0);

    await user.click(addButton());
    expect(screen.getByText("Obtenida")).toBeTruthy();

    rerenderCard(rerender, 5);

    expect(screen.getByText("Repetida · 5 copias")).toBeTruthy();
    expect(screen.queryByText("Obtenida")).toBeNull();
  });

  it("never keeps an optimistic value the server did not confirm", async () => {
    const user = userEvent.setup();
    const { rerender } = renderCard(0);

    await user.click(addButton());
    rerenderCard(rerender, 5);

    expect(screen.getByText("Repetida · 5 copias")).toBeTruthy();
    expect(screen.queryByText("Repetida · 1 copias")).toBeNull();
  });

  it("keeps the list view stable: optimistic state but no celebration", async () => {
    const user = userEvent.setup();
    renderCard(0, "list");

    await user.click(addButton());

    expect(mocks.animate).not.toHaveBeenCalled();
    expect(particles()).toBe(0);
    expect(ghosts()).toBe(0);
    expect(screen.getByText("Obtenida")).toBeTruthy();
  });
});

/**
 * Focused review of the optimistic overlay. The overlay must never outlive the
 * server's answer, and the safety timer must never survive a reconciliation.
 */
describe("StickerCard optimistic overlay", () => {
  it("rolls back when the server never confirms the change", async () => {
    vi.useFakeTimers();
    renderCard(0);

    click(addButton());
    expect(screen.getByText("Obtenida")).toBeTruthy();

    await act(() => vi.advanceTimersByTimeAsync(OPTIMISTIC_TIMEOUT_MS));

    expect(screen.getByText("Faltante")).toBeTruthy();
    expect(screen.queryByText("Obtenida")).toBeNull();
  });

  it("clears the safety timer so a stale rollback cannot clobber the server value", async () => {
    vi.useFakeTimers();
    const { rerender } = renderCard(0);

    click(addButton());
    await act(() => vi.advanceTimersByTimeAsync(4000));

    // The server confirms: the pending rollback for the click must die.
    rerenderCard(rerender, 1);
    expect(screen.getByText("Obtenida")).toBeTruthy();

    // 6000 ms since the click. A surviving timer would have fired at 5000 ms.
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByText("Obtenida")).toBeTruthy();
  });

  it("does not restart the safety window from a blocked pending click", async () => {
    vi.useFakeTimers();
    mocks.adjustQuantityAction.mockImplementation(() => new Promise<void>(() => {}));
    renderCard(0);

    click(addButton());
    expect(screen.getByText("Obtenida")).toBeTruthy();
    expect((addButton() as HTMLButtonElement).disabled).toBe(true);

    await act(() => vi.advanceTimersByTimeAsync(OPTIMISTIC_TIMEOUT_MS - 100));
    click(addButton());
    expect(screen.queryByText("Repetida · 2 copias")).toBeNull();

    // The blocked click cannot restart the timeout. The original optimistic
    // value therefore rolls back at its original deadline.
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(screen.getByText("Faltante")).toBeTruthy();
  });

  it("leaves no pending timer behind after unmount", () => {
    vi.useFakeTimers();
    const { unmount } = renderCard(0);

    click(addButton());
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

/**
 * Focused review of the decorative layer's accessibility contract.
 */
describe("StickerCard decorative layer accessibility", () => {
  const FOCUSABLE = "button, a, input, select, textarea, [tabindex]";

  it("hides the burst from assistive tech and from the pointer", async () => {
    const user = userEvent.setup();
    renderCard(0);

    await user.click(addButton());

    const burst = document.querySelector(".sticker-burst");
    expect(burst).not.toBeNull();
    expect(burst!.getAttribute("aria-hidden")).toBe("true");
    expect(burst!.className).toContain("pointer-events-none");
    expect(burst!.querySelectorAll(FOCUSABLE).length).toBe(0);
    expect(burst!.querySelectorAll(".sticker-burst-particle").length).toBe(6);
  });

  it("hides the ghost from assistive tech and from the pointer", async () => {
    const user = userEvent.setup();
    renderCard(1);

    await user.click(addButton());

    const ghost = document.querySelector(".sticker-ghost");
    expect(ghost).not.toBeNull();
    expect(ghost!.getAttribute("aria-hidden")).toBe("true");
    expect(ghost!.className).toContain("pointer-events-none");
    expect(ghost!.querySelectorAll(FOCUSABLE).length).toBe(0);
  });

  it("adds no live region and keeps the existing labels intact", async () => {
    const user = userEvent.setup();
    renderCard(0);

    expect(document.querySelectorAll("[aria-live]").length).toBe(0);

    await user.click(addButton());

    expect(document.querySelectorAll("[aria-live]").length).toBe(0);
    expect(screen.getByText("Obtenida")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Añadir copia de lámina 004" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Quitar copia de lámina 004" })).toBeTruthy();
  });

  it("unmounts the decorative layer once the animation window closes", async () => {
    vi.useFakeTimers();
    renderCard(0);

    click(addButton());
    expect(particles()).toBe(6);

    await act(() => vi.advanceTimersByTimeAsync(CLEAR_MS.obtained));

    expect(particles()).toBe(0);
    expect(ghosts()).toBe(0);
    expect(screen.getByText("Obtenida")).toBeTruthy();
  });
});
