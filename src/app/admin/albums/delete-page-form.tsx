"use client";

import { useActionState } from "react";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { pageDeletionConfirmation } from "@/lib/catalog/page-deletion-copy";
import { deleteSectionAction, type CatalogActionState } from "./actions";

/**
 * Page deletion with an explicit, count-aware confirmation.
 *
 * The warning text depends on how many stickers the page currently holds, so it
 * is built at click time from the server-rendered count instead of being a
 * static string. The confirmation itself is the shared `ConfirmAction`
 * primitive (native <dialog>, Escape/backdrop, focus restore, pending), which
 * replaces the previous main-thread-blocking `window.confirm`.
 */
export function DeletePageForm({
  albumId,
  sectionId,
  sectionName,
  stickerCount,
}: {
  albumId: string;
  sectionId: string;
  sectionName: string;
  stickerCount: number;
}) {
  const [state, formAction, pending] = useActionState(
    deleteSectionAction,
    {} as CatalogActionState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="albumId" value={albumId} />
      <input type="hidden" name="sectionId" value={sectionId} />
      <ConfirmAction
        title="Eliminar página"
        description={pageDeletionConfirmation(sectionName, stickerCount)}
        confirmLabel="Eliminar"
        pendingLabel="Eliminando…"
        triggerLabel="Eliminar"
        triggerAriaLabel={`Eliminar página ${sectionName}`}
        triggerClassName="rounded border border-border bg-surface px-2 text-sm text-danger hover:bg-surface-muted"
        pending={pending}
      />
      {state.error ? (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-xs text-success" role="status">{state.success}</p> : null}
    </form>
  );
}
