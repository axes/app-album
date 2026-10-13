"use client";

import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { InlineMessage } from "@/components/ui/inline-message";
import { removeAlbumAction } from "./actions";

/**
 * Compact "Quitar de mi colección" control for the album detail header.
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
 *        The first click paints an inline confirmation panel on the same
 *        frame; the Server Action is NOT invoked yet.
 *     2. The "Confirmar eliminación" button inside the panel calls
 *        `removeAlbumAction` inside `useTransition`, so the disabled state
 *        and "Quitando…" label commit on the same frame as the click — not
 *        when the RSC response eventually streams back.
 *     3. "Cancelar" closes the panel and returns to the initial state.
 *
 *   The Server Action (`removeAlbumAction`) and its `redirect("/app")` are
 *   untouched. There is no `router.refresh` or extra revalidation here.
 */
export function RemoveAlbumButton({ userAlbumId }: { userAlbumId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const panelId = useId();

  function openPanel() {
    if (isPending) return;
    setIsOpen(true);
  }

  function closePanel() {
    if (isPending) return;
    setIsOpen(false);
  }

  function onConfirm() {
    if (isPending) return;
    const data = new FormData();
    data.set("userAlbumId", userAlbumId);
    // startTransition commits `isPending = true` on the same frame as the
    // click, so the "Quitando…" paint is the first paint after the
    // interaction and not deferred until the Server Action returns.
    startTransition(async () => {
      await removeAlbumAction(data);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="danger"
        size="md"
        disabled={isPending}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={openPanel}
        data-testid="remove-album-trigger"
      >
        Quitar de mi colección
      </Button>

      {isPending ? (
        <InlineMessage
          variant="pending"
          data-testid="remove-album-pending"
        >
          Quitando álbum…
        </InlineMessage>
      ) : null}

      {isOpen && !isPending ? (
        <RemoveConfirmPanel
          panelId={panelId}
          onConfirm={onConfirm}
          onCancel={closePanel}
        />
      ) : null}
    </div>
  );
}

function RemoveConfirmPanel({
  panelId,
  onConfirm,
  onCancel,
}: {
  panelId: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <section
      id={panelId}
      role="alertdialog"
      aria-modal="false"
      aria-labelledby={`${panelId}-title`}
      aria-describedby={`${panelId}-description`}
      data-testid="remove-album-confirm"
      className="flex flex-col gap-3 rounded-control border border-danger bg-surface p-3"
    >
      <div className="flex flex-col gap-1">
        <p id={`${panelId}-title`} className="text-sm font-semibold text-content">
          ¿Quitar este álbum?
        </p>
        <p id={`${panelId}-description`} className="text-sm text-muted">
          Se eliminará todo el progreso registrado.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="danger"
          size="md"
          onClick={onConfirm}
          autoFocus
          data-testid="remove-album-confirm-button"
        >
          Confirmar eliminación
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onCancel}
          data-testid="remove-album-cancel-button"
        >
          Cancelar
        </Button>
      </div>
    </section>
  );
}
