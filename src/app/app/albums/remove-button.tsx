"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { removeAlbumAction } from "./actions";

/**
 * "Quitar de mi colección" control for the album detail header.
 *
 * Why this is two-step now (and not `window.confirm`):
 *
 *   The previous implementation used `window.confirm`, a synchronous
 *   main-thread-blocking dialog. From the user's perspective the click was
 *   effectively silent until the Server Action's RSC response streamed back,
 *   so Chrome's INP budget was spent on a paint that did not arrive until
 *   several hundred milliseconds (or more) later.
 *
 *   This component now:
 *
 *     1. Shows a "Quitar de mi colección" trigger button (type="button").
 *        The first click opens a native <dialog> modal on the same frame;
 *        the Server Action is NOT invoked yet.
 *     2. The "Quitar álbum" button inside the modal calls
 *        `removeAlbumAction` inside `useTransition`, so the disabled state
 *        and "Quitando álbum…" label commit on the same frame as the
 *        click — not when the RSC response eventually streams back.
 *     3. "Cancelar" (or Escape, or a click on the backdrop) closes the
 *        modal and returns focus to the original trigger.
 *
 *   The Server Action (`removeAlbumAction`) and its `redirect("/app")` are
 *   untouched. There is no `router.refresh` or extra revalidation here.
 *
 *   The trigger is a low-emphasis outlined danger button: removing an album
 *   is rare and destructive, so it must not outweigh the page's primary
 *   actions. The filled danger treatment is reserved for the confirm button
 *   inside the dialog.
 */
export function RemoveAlbumButton({ userAlbumId }: { userAlbumId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;

  // Open/close the native <dialog> as a side effect of React state, so the
  // first click paints the modal on the same frame (showModal() is sync and
  // cheap). While pending we keep the dialog open and explicitly disable
  // backdrop / Escape dismissal.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function openModal() {
    if (isPending) return;
    setIsOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setIsOpen(false);
    // Defer the focus restore until after React commits the unmount, so the
    // trigger is the next focusable element in the tab order.
    queueMicrotask(() => {
      triggerRef.current?.focus();
    });
  }

  function onCancelNative(event: React.SyntheticEvent<HTMLDialogElement>) {
    // Fired by the browser when Escape is pressed or the dialog is closed
    // via the platform (e.g. dialog.close()). Block the close while the
    // Server Action is in flight; otherwise mirror React state.
    if (isPending) {
      event.preventDefault();
      return;
    }
    if (isOpen) setIsOpen(false);
    triggerRef.current?.focus();
  }

  function onConfirm() {
    if (isPending) return;
    const data = new FormData();
    data.set("userAlbumId", userAlbumId);
    // startTransition commits `isPending = true` on the same frame as the
    // click, so the "Quitando álbum…" paint is the first paint after the
    // interaction and not deferred until the Server Action returns.
    startTransition(async () => {
      await removeAlbumAction(data);
    });
  }

  function onBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    // <dialog> clicks with target === dialog itself land on the backdrop,
    // not on the inner content. We allow those to close the modal as long
    // as we are not pending.
    if (isPending) return;
    if (event.target === dialogRef.current) {
      closeModal();
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={isPending}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={openModal}
        data-testid="remove-album-trigger"
        className={[
          "inline-flex min-h-11 items-center justify-center rounded-control border border-danger bg-transparent px-4 text-sm font-medium text-danger",
          "transition-[color,background-color,border-color,opacity] duration-[var(--transition-fast)] ease-[var(--ease-standard)]",
          "danger-ghost focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
      >
        Quitar de mi colección
      </button>

      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={onCancelNative}
        onClick={onBackdropClick}
        data-testid="remove-album-confirm"
        className={[
          "w-[calc(100%_-_2rem)] max-w-md p-0 m-auto",
          "rounded-card border border-border bg-surface text-content",
          "shadow-lg",
          "backdrop:bg-[color:color-mix(in_oklab,var(--album-overlay)_60%,transparent)]",
          "backdrop:backdrop-blur-sm",
        ].join(" ")}
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <h2
              id={titleId}
              className="text-base font-semibold leading-snug text-content"
            >
              ¿Quitar este álbum?
            </h2>
            <p
              id={descriptionId}
              className="text-sm leading-relaxed text-muted"
            >
              Se eliminará todo el progreso registrado.
            </p>
          </div>

          {isPending ? (
            <p
              role="status"
              aria-live="polite"
              data-testid="remove-album-pending"
              className="rounded-control border border-border bg-surface-muted px-3 py-2 text-sm text-content"
            >
              Quitando álbum…
            </p>
          ) : null}

          <div
            className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            data-testid="remove-album-actions"
          >
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={closeModal}
              disabled={isPending}
              data-testid="remove-album-cancel-button"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={onConfirm}
              disabled={isPending}
              autoFocus={!isPending}
              data-testid="remove-album-confirm-button"
            >
              {isPending ? "Quitando álbum…" : "Quitar álbum"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
