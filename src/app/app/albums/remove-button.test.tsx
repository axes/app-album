// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RemoveAlbumButton } from "./remove-button";

/**
 * jsdom does not implement HTMLDialogElement's modal machinery: `showModal()`
 * and `close()` are no-ops and `dialog.open` is never updated. We polyfill
 * enough of the API surface for the component to behave the way it does in
 * a real browser, while keeping the semantics observable from the tests.
 */
type DialogLike = HTMLDialogElement & { open: boolean };

if (typeof window !== "undefined" && typeof window.HTMLDialogElement !== "undefined") {
  const proto = window.HTMLDialogElement.prototype as DialogLike;
  if (!proto.showModal) {
    proto.showModal = function showModal(this: DialogLike) {
      this.open = true;
    };
  }
  if (!proto.close) {
    proto.close = function close(this: DialogLike) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
  }
}

const removeAlbumActionMock = vi.fn();
const userAlbumId = "00000000-0000-4000-8000-0000000000aa";

vi.mock("./actions", () => ({
  removeAlbumAction: (data: FormData) => removeAlbumActionMock(data),
}));

afterEach(() => {
  cleanup();
  removeAlbumActionMock.mockReset();
});

describe("RemoveAlbumButton", () => {
  beforeEach(() => {
    removeAlbumActionMock.mockResolvedValue(undefined);
  });

  it("uses a valid responsive calc width", () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);
    const dialog = screen.getByTestId("remove-album-confirm");
    expect(dialog.className).toContain("w-[calc(100%_-_2rem)]");
    expect(dialog.className).not.toContain("w-[calc(100%-2rem)]");
  });

  it("does not call the Server Action on the first click", () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));

    expect(removeAlbumActionMock).not.toHaveBeenCalled();
  });

  it("opens a modal dialog on the first click with no native confirm", () => {
    const confirmSpy = vi.spyOn(window, "confirm");

    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    const dialog = screen.getByTestId("remove-album-confirm") as HTMLDialogElement;
    expect(dialog.open).toBe(false);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));

    expect(dialog.open).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("renders the modal as a dialog with a title and description", () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));

    const dialog = screen.getByTestId("remove-album-confirm");
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog.querySelector('[id$="-title"]')?.textContent).toBe(
      "¿Quitar este álbum?",
    );
    expect(dialog.querySelector('[id$="-description"]')?.textContent).toContain(
      "progreso",
    );
  });

  it("wires the trigger to the dialog via aria-haspopup and aria-controls", () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    const trigger = screen.getByTestId("remove-album-trigger");
    const dialog = screen.getByTestId("remove-album-confirm");

    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("cancels the confirmation without invoking the Server Action", async () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));

    const dialog = screen.getByTestId("remove-album-confirm") as HTMLDialogElement;
    expect(dialog.open).toBe(true);

    fireEvent.click(screen.getByTestId("remove-album-cancel-button"));

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(removeAlbumActionMock).not.toHaveBeenCalled();
  });

  it("closes the modal on Escape via the native cancel event", async () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));

    const dialog = screen.getByTestId("remove-album-confirm") as HTMLDialogElement;
    expect(dialog.open).toBe(true);

    fireEvent.keyDown(dialog, { key: "Escape" });
    act(() => {
      dialog.dispatchEvent(new Event("cancel", { bubbles: false, cancelable: true }));
    });

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(removeAlbumActionMock).not.toHaveBeenCalled();
  });

  it("calls the Server Action exactly once when confirming", async () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));
    fireEvent.click(screen.getByTestId("remove-album-confirm-button"));

    await waitFor(() => expect(removeAlbumActionMock).toHaveBeenCalledTimes(1));

    const payload = removeAlbumActionMock.mock.calls[0]?.[0] as FormData;
    expect(payload.get("userAlbumId")).toBe(userAlbumId);
  });

  it("shows the Quitando… pending message immediately after confirming", async () => {
    let resolveAction: (() => void) | null = null;
    removeAlbumActionMock.mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveAction = () => resolve();
      }),
    );

    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));
    fireEvent.click(screen.getByTestId("remove-album-confirm-button"));

    await waitFor(() => {
      expect(screen.getByTestId("remove-album-pending")).toBeTruthy();
    });
    expect(screen.getByTestId("remove-album-pending").textContent).toBe(
      "Quitando álbum…",
    );
    expect(screen.getByTestId("remove-album-confirm-button").hasAttribute("disabled"))
      .toBe(true);
    expect(screen.getByTestId("remove-album-cancel-button").hasAttribute("disabled"))
      .toBe(true);
    expect(screen.getByTestId("remove-album-trigger").hasAttribute("disabled"))
      .toBe(true);

    await act(async () => {
      resolveAction?.();
    });
  });

  it("prevents a second submission while the action is in flight", async () => {
    let resolveAction: (() => void) | null = null;
    removeAlbumActionMock.mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveAction = () => resolve();
      }),
    );

    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));
    fireEvent.click(screen.getByTestId("remove-album-confirm-button"));

    await waitFor(() => {
      expect(screen.getByTestId("remove-album-pending")).toBeTruthy();
    });

    // The trigger is disabled while pending, so reopening the panel and
    // confirming again must not produce a second Server Action call.
    const trigger = screen.getByTestId("remove-album-trigger");
    expect(trigger.hasAttribute("disabled")).toBe(true);
    fireEvent.click(trigger);
    expect(removeAlbumActionMock).toHaveBeenCalledTimes(1);

    // The confirm button inside the modal is also disabled, so a synthetic
    // click cannot enqueue a second action either.
    const confirmButton = screen.getByTestId("remove-album-confirm-button");
    expect(confirmButton.hasAttribute("disabled")).toBe(true);
    fireEvent.click(confirmButton);
    expect(removeAlbumActionMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAction?.();
    });
  });

  it("does not close the modal while the action is in flight", async () => {
    let resolveAction: (() => void) | null = null;
    removeAlbumActionMock.mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveAction = () => resolve();
      }),
    );

    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));
    fireEvent.click(screen.getByTestId("remove-album-confirm-button"));

    await waitFor(() => {
      expect(screen.getByTestId("remove-album-pending")).toBeTruthy();
    });

    const dialog = screen.getByTestId("remove-album-confirm") as HTMLDialogElement;
    expect(dialog.open).toBe(true);

    // The cancel button is disabled, so clicking it cannot close the modal.
    const cancelButton = screen.getByTestId("remove-album-cancel-button") as HTMLButtonElement;
    expect(cancelButton.disabled).toBe(true);
    fireEvent.click(cancelButton);
    expect(dialog.open).toBe(true);

    // Escape is also blocked: the cancel handler preventDefault()s and
    // keeps the dialog open.
    act(() => {
      dialog.dispatchEvent(new Event("cancel", { bubbles: false, cancelable: true }));
    });
    expect(dialog.open).toBe(true);

    await act(async () => {
      resolveAction?.();
    });
  });
});
