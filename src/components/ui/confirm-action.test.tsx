// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { useActionState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ConfirmAction } from "./confirm-action";

/**
 * jsdom does not implement HTMLDialogElement's modal machinery: `showModal()`
 * and `close()` are no-ops and `dialog.open` is never updated. We polyfill
 * enough of the API surface for the component to behave the way it does in a
 * real browser, while keeping the semantics observable from the tests.
 */
type DialogLike = HTMLDialogElement & { open: boolean };

if (
  typeof window !== "undefined" &&
  typeof window.HTMLDialogElement !== "undefined"
) {
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

type State = { ok?: boolean };

function Harness({
  action,
  pendingLabel = "Eliminando…",
}: {
  action: (state: State, data: FormData) => Promise<State>;
  pendingLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as State);
  return (
    <form action={formAction}>
      <input type="hidden" name="albumId" value="album-1" />
      <ConfirmAction
        title="¿Eliminar este álbum?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar álbum"
        pendingLabel={pendingLabel}
        triggerLabel="Eliminar álbum"
        triggerTestId="confirm-trigger"
        pending={pending}
      />
      <span data-testid="state">{state.ok ? "ok" : "idle"}</span>
    </form>
  );
}

function dialog(): HTMLDialogElement {
  return document.querySelector(
    '[data-component="confirm-action"]',
  ) as HTMLDialogElement;
}

afterEach(() => {
  cleanup();
});

describe("ConfirmAction", () => {
  it("renders a closed dialog and does not submit on the first click", () => {
    const action = vi.fn(async () => ({}));
    render(<Harness action={action} />);

    const trigger = screen.getByTestId("confirm-trigger");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(dialog().open).toBe(false);

    fireEvent.click(trigger);

    expect(dialog().open).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(action).not.toHaveBeenCalled();
  });

  it("exposes an alertdialog with an accessible title and description", () => {
    const action = vi.fn(async () => ({}));
    render(<Harness action={action} />);

    fireEvent.click(screen.getByTestId("confirm-trigger"));

    const panel = dialog();
    expect(panel.getAttribute("role")).toBe("alertdialog");
    const titleId = panel.getAttribute("aria-labelledby");
    const descriptionId = panel.getAttribute("aria-describedby");
    expect(document.getElementById(titleId ?? "")?.textContent).toBe(
      "¿Eliminar este álbum?",
    );
    expect(document.getElementById(descriptionId ?? "")?.textContent).toContain(
      "no se puede deshacer",
    );
  });

  it("cancels without submitting and restores focus to the trigger", async () => {
    const action = vi.fn(async () => ({}));
    render(<Harness action={action} />);

    const trigger = screen.getByTestId("confirm-trigger");
    fireEvent.click(trigger);
    expect(dialog().open).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(dialog().open).toBe(false));
    expect(action).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("closes on Escape through the native cancel event without submitting", async () => {
    const action = vi.fn(async () => ({}));
    render(<Harness action={action} />);

    fireEvent.click(screen.getByTestId("confirm-trigger"));
    const panel = dialog();
    expect(panel.open).toBe(true);

    act(() => {
      panel.dispatchEvent(
        new Event("cancel", { bubbles: false, cancelable: true }),
      );
    });

    await waitFor(() => expect(panel.open).toBe(false));
    expect(action).not.toHaveBeenCalled();
  });

  it("closes when the backdrop is clicked without submitting", async () => {
    const action = vi.fn(async () => ({}));
    render(<Harness action={action} />);

    fireEvent.click(screen.getByTestId("confirm-trigger"));
    const panel = dialog();

    fireEvent.click(panel, { target: panel });

    await waitFor(() => expect(panel.open).toBe(false));
    expect(action).not.toHaveBeenCalled();
  });

  it("submits the surrounding form exactly once with the preserved payload", async () => {
    const action = vi.fn(async () => ({ ok: true }));
    render(<Harness action={action} />);

    fireEvent.click(screen.getByTestId("confirm-trigger"));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Eliminar álbum" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const payload = action.mock.calls[0]?.[1] as FormData;
    expect(payload.get("albumId")).toBe("album-1");
    await waitFor(() =>
      expect(screen.getByTestId("state").textContent).toBe("ok"),
    );
  });

  it("keeps the dialog open, disables both buttons and announces pending", async () => {
    let resolveAction: ((state: State) => void) | null = null;
    const action = vi.fn(
      () =>
        new Promise<State>((resolve) => {
          resolveAction = resolve;
        }),
    );
    render(<Harness action={action} />);

    fireEvent.click(screen.getByTestId("confirm-trigger"));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Eliminar álbum" }));

    await waitFor(() =>
      expect(
        document.querySelector('[data-component="confirm-action-pending"]'),
      ).toBeTruthy(),
    );
    expect(dialog().open).toBe(true);
    expect(
      within(dialog())
        .getByRole("button", { name: "Eliminando…" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      within(dialog())
        .getByRole("button", { name: "Cancelar" })
        .hasAttribute("disabled"),
    ).toBe(true);

    await act(async () => {
      resolveAction?.({ ok: true });
    });
    await waitFor(() => expect(dialog().open).toBe(false));
  });

  it("does not enqueue a second action when confirm is clicked twice", async () => {
    let resolveAction: ((state: State) => void) | null = null;
    const action = vi.fn(
      () =>
        new Promise<State>((resolve) => {
          resolveAction = resolve;
        }),
    );
    render(<Harness action={action} />);

    fireEvent.click(screen.getByTestId("confirm-trigger"));
    const confirm = within(dialog()).getByRole("button", {
      name: "Eliminar álbum",
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    fireEvent.click(confirm);
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAction?.({ ok: true });
    });
  });

  it("enforces a 44px minimum touch target on the trigger and dialog buttons", () => {
    const action = vi.fn(async () => ({}));
    render(<Harness action={action} />);

    fireEvent.click(screen.getByTestId("confirm-trigger"));

    expect(screen.getByTestId("confirm-trigger").className).toContain("min-h-11");
    expect(
      within(dialog()).getByRole("button", { name: "Cancelar" }).className,
    ).toContain("min-h-11");
    expect(
      within(dialog()).getByRole("button", { name: "Eliminar álbum" })
        .className,
    ).toContain("min-h-11");
  });

  it("uses a valid calc() width utility on the dialog", () => {
    const action = vi.fn(async () => ({}));
    render(<Harness action={action} />);
    expect(dialog().className).toContain("w-[calc(100%_-_2rem)]");
    expect(dialog().className).not.toContain("w-[calc(100%-2rem)]");
  });
});

describe("ConfirmAction with an external form", () => {
  it("submits the form referenced by formId", async () => {
    const action = vi.fn(async () => ({ ok: true }));

    function ExternalFormHarness() {
      const [state, formAction, pending] = useActionState(action, {} as State);
      return (
        <div>
          <form action={formAction} id="delete-form">
            <input type="hidden" name="stickerIds" value="s1,s2" />
          </form>
          <ConfirmAction
            title="¿Eliminar las 2 láminas seleccionadas?"
            confirmLabel="Eliminar seleccionadas"
            triggerLabel="Eliminar seleccionadas"
            triggerTestId="bulk-trigger"
            formId="delete-form"
            pending={pending}
          />
          <span data-testid="state">{state.ok ? "ok" : "idle"}</span>
        </div>
      );
    }

    render(<ExternalFormHarness />);

    fireEvent.click(screen.getByTestId("bulk-trigger"));
    fireEvent.click(
      within(dialog()).getByRole("button", { name: "Eliminar seleccionadas" }),
    );

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const payload = action.mock.calls[0]?.[1] as FormData;
    expect(payload.get("stickerIds")).toBe("s1,s2");
  });
});
