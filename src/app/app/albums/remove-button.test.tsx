// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RemoveAlbumButton } from "./remove-button";

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

  it("does not call the Server Action on the first click", () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));

    expect(removeAlbumActionMock).not.toHaveBeenCalled();
  });

  it("shows an inline confirmation panel on the first click with no native dialog", () => {
    const confirmSpy = vi.spyOn(window, "confirm");

    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));

    expect(screen.getByTestId("remove-album-confirm")).toBeTruthy();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("renders the confirmation as an alertdialog with a title and description", () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));

    const panel = screen.getByTestId("remove-album-confirm");
    expect(panel.getAttribute("role")).toBe("alertdialog");
    expect(panel.querySelector('[id$="-title"]')?.textContent).toBe(
      "¿Quitar este álbum?",
    );
    expect(panel.querySelector('[id$="-description"]')?.textContent).toContain(
      "progreso",
    );
  });

  it("toggles aria-expanded on the trigger button", () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    const trigger = screen.getByTestId("remove-album-trigger");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("cancels the confirmation without invoking the Server Action", () => {
    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));
    fireEvent.click(screen.getByTestId("remove-album-cancel-button"));

    expect(screen.queryByTestId("remove-album-confirm")).toBeNull();
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
    expect(screen.queryByTestId("remove-album-confirm")).toBeNull();
    expect(removeAlbumActionMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAction?.();
    });
  });

  it("hides the confirmation panel while pending", () => {
    let resolveAction: (() => void) | null = null;
    removeAlbumActionMock.mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveAction = () => resolve();
      }),
    );

    render(<RemoveAlbumButton userAlbumId={userAlbumId} />);

    fireEvent.click(screen.getByTestId("remove-album-trigger"));
    fireEvent.click(screen.getByTestId("remove-album-confirm-button"));

    expect(screen.queryByTestId("remove-album-confirm")).toBeNull();
    expect(screen.getByTestId("remove-album-pending")).toBeTruthy();

    return act(async () => {
      resolveAction?.();
    });
  });
});
