// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  enableSharingAction: vi.fn(async () => undefined),
  disableSharingAction: vi.fn(async () => undefined),
}));

vi.mock("../actions", () => ({
  enableSharingAction: mocks.enableSharingAction,
  disableSharingAction: mocks.disableSharingAction,
}));

import { ShareControls } from "./share-controls";

/**
 * Installs a clipboard mock on the real `window.navigator` object. `userEvent`
 * replaces `navigator.clipboard` with its own stub during `setup()`, so this
 * must run afterwards and is torn down explicitly in `afterEach`.
 */
function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  // Remove the per-test clipboard override so the next test starts clean.
  delete (window.navigator as { clipboard?: unknown }).clipboard;
});

const TOKEN = "a".repeat(43);

describe("ShareControls", () => {
  it("offers activation when sharing is disabled", async () => {
    const user = userEvent.setup();
    render(<ShareControls sharing={{ enabled: false, token: null }} userAlbumId="collection-1" />);

    expect(screen.getByText("Compartir colección")).toBeTruthy();
    expect(screen.queryByLabelText("Enlace público")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Activar enlace público" }));
    await waitFor(() => expect(mocks.enableSharingAction).toHaveBeenCalledTimes(1));
    const formData = mocks.enableSharingAction.mock.calls[0][0] as FormData;
    expect(formData.get("userAlbumId")).toBe("collection-1");
  });

  it("shows the readonly link and copies the absolute URL", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => undefined);
    mockClipboard(writeText);
    render(<ShareControls sharing={{ enabled: true, token: TOKEN }} userAlbumId="collection-1" />);

    const input = screen.getByLabelText("Enlace público") as HTMLInputElement;
    expect(input.value).toBe(`/share/${TOKEN}`);
    expect(input.readOnly).toBe(true);

    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/share/${TOKEN}`));
    expect(screen.getByRole("button", { name: "Copiado" })).toBeTruthy();
  });

  it("keeps the readonly input selected as a fallback when the clipboard rejects", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => {
      throw new Error("denied");
    });
    mockClipboard(writeText);
    render(<ShareControls sharing={{ enabled: true, token: TOKEN }} userAlbumId="collection-1" />);

    const input = screen.getByLabelText("Enlace público") as HTMLInputElement;
    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(input.value).toBe(`/share/${TOKEN}`);
    // The fallback must leave the whole link selected for manual copying.
    await waitFor(() => expect(input.selectionStart).toBe(0));
    expect(input.selectionEnd).toBe(input.value.length);
    expect(screen.getByRole("button", { name: "Copiar enlace" })).toBeTruthy();
  });

  it("falls back to the selected input when the Clipboard API is unavailable", async () => {
    const user = userEvent.setup();
    // No `navigator.clipboard` at all: the productive try/catch must still
    // select the readonly input instead of throwing.
    delete (window.navigator as { clipboard?: unknown }).clipboard;
    render(<ShareControls sharing={{ enabled: true, token: TOKEN }} userAlbumId="collection-1" />);

    const input = screen.getByLabelText("Enlace público") as HTMLInputElement;
    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));

    await waitFor(() => expect(input.selectionStart).toBe(0));
    expect(input.selectionEnd).toBe(input.value.length);
    expect(input.value).toBe(`/share/${TOKEN}`);
    expect(screen.getByRole("button", { name: "Copiar enlace" })).toBeTruthy();
  });

  it("submits the deactivation action with the collection id", async () => {
    const user = userEvent.setup();
    render(<ShareControls sharing={{ enabled: true, token: TOKEN }} userAlbumId="collection-1" />);

    await user.click(screen.getByRole("button", { name: "Desactivar enlace" }));
    await waitFor(() => expect(mocks.disableSharingAction).toHaveBeenCalledTimes(1));
    const formData = mocks.disableSharingAction.mock.calls[0][0] as FormData;
    expect(formData.get("userAlbumId")).toBe("collection-1");
  });
});
