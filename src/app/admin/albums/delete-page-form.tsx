"use client";

import { useActionState } from "react";
import { pageDeletionConfirmation } from "@/lib/catalog/page-deletion-copy";
import { deleteSectionAction, type CatalogActionState } from "./actions";

/**
 * Page deletion with an explicit, count-aware confirmation.
 *
 * The warning text depends on how many stickers the page currently holds, so it
 * is built at click time from the server-rendered count instead of being a
 * static string.
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
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(pageDeletionConfirmation(sectionName, stickerCount))) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="albumId" value={albumId} />
      <input type="hidden" name="sectionId" value={sectionId} />
      <button
        className="rounded border border-border bg-surface px-2 py-1 text-sm text-danger hover:bg-surface-muted"
        disabled={pending}
        aria-label={`Eliminar página ${sectionName}`}
      >
        Eliminar
      </button>
      {state.error ? (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-xs text-success">{state.success}</p> : null}
    </form>
  );
}
