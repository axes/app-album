"use client";

import { useActionState } from "react";
import {
  changeAlbumStatusAction,
  deleteAlbumAction,
  type CatalogActionState,
} from "./actions";

const button =
  "rounded bg-primary px-3 py-1.5 text-sm text-primary-text hover:underline";
const dangerButton =
  "rounded border border-border bg-surface px-3 py-1.5 text-sm text-danger hover:bg-surface-muted";

/**
 * Album-level actions (publish / back to draft / delete).
 *
 * Rendered twice — top and bottom of the editor — from the same component and
 * the same server actions, so there is no duplicated logic.
 */
export function AlbumActions({
  albumId,
  status,
}: {
  albumId: string;
  status: "draft" | "published";
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    changeAlbumStatusAction,
    {} as CatalogActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAlbumAction,
    {} as CatalogActionState,
  );
  const state = statusState.error || statusState.success ? statusState : deleteState;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={statusAction}>
        <input type="hidden" name="albumId" value={albumId} />
        <input type="hidden" name="status" value={status === "draft" ? "published" : "draft"} />
        <button className={button} disabled={statusPending}>
          {status === "draft" ? "Publicar" : "Volver a borrador"}
        </button>
      </form>
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (!window.confirm("¿Eliminar este álbum? Esta acción no se puede deshacer.")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="albumId" value={albumId} />
        <button className={dangerButton} disabled={deletePending}>
          Eliminar álbum
        </button>
      </form>
      {state.error ? (
        <p className="w-full text-xs text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="w-full text-xs text-success">{state.success}</p> : null}
    </div>
  );
}
