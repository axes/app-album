"use client";

import { useActionState } from "react";
import type { AlbumSummary } from "@/lib/catalog/service";
import { createAlbumAction, updateAlbumAction, type CatalogActionState } from "./actions";

const initial: CatalogActionState = {};

const fieldClass =
  "rounded border border-input-border bg-input px-3 py-2 text-content";

export function AlbumForm({ album }: { album?: AlbumSummary }) {
  const action = album ? updateAlbumAction : createAlbumAction;
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} className="grid gap-3">
      {album ? <input type="hidden" name="albumId" value={album.id} /> : null}
      <label className="grid gap-1">
        <span className="text-sm">Título</span>
        <input className={fieldClass} name="title" required maxLength={160} defaultValue={album?.title} />
      </label>
      <label className="grid gap-1">
        <span className="text-sm">Descripción</span>
        <textarea className={fieldClass} name="description" maxLength={5000} defaultValue={album?.description ?? ""} />
      </label>
      <label className="grid gap-1">
        <span className="text-sm">Editorial</span>
        <input className={fieldClass} name="publisher" maxLength={160} defaultValue={album?.publisher ?? ""} />
      </label>
      <label className="grid gap-1">
        <span className="text-sm">Año</span>
        <input className={fieldClass} name="year" type="number" min={1800} max={2200} defaultValue={album?.year ?? ""} />
      </label>
      <label className="grid gap-1">
        <span className="text-sm">URL de portada</span>
        <input className={fieldClass} name="coverUrl" type="url" maxLength={2048} defaultValue={album?.coverUrl ?? ""} />
      </label>
      {state.error ? <p className="text-sm text-danger" role="alert">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <button
        className="rounded bg-primary px-4 py-2 text-primary-text disabled:opacity-50"
        disabled={pending}
      >
        {album ? "Guardar información" : "Crear álbum"}
      </button>
    </form>
  );
}
