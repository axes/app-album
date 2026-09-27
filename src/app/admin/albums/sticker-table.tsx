"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { Sticker } from "@/lib/catalog/service";
import {
  deleteStickerAction,
  moveStickerAction,
  updateStickerAction,
  type CatalogActionState,
} from "./actions";

const field = "w-full rounded border border-input-border bg-input px-2 py-1 text-sm text-content";
const iconButton =
  "rounded border border-border bg-surface px-2 py-0.5 text-xs text-content hover:bg-surface-muted disabled:opacity-40";
const dangerButton =
  "rounded border border-border bg-surface px-2 py-0.5 text-xs text-danger hover:bg-surface-muted";

type PageOption = { id: string; name: string };
type EditableField = "code" | "name" | "page";
type ActiveCell = { stickerId: string; field: EditableField } | null;

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m4 14.5-.5 2 2-.5L15 6.5 13.5 5 4 14.5Z" />
      <path d="m12.5 6 1.5 1.5" />
    </svg>
  );
}

function MoveButton({
  albumId,
  stickerId,
  direction,
  label,
  disabled,
}: {
  albumId: string;
  stickerId: string;
  direction: "up" | "down";
  label: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    moveStickerAction,
    {} as CatalogActionState,
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="albumId" value={albumId} />
      <input type="hidden" name="stickerId" value={stickerId} />
      <input type="hidden" name="direction" value={direction} />
      <button className={iconButton} disabled={disabled || pending} aria-label={label} title={label}>
        {direction === "up" ? "↑" : "↓"}
      </button>
      {state.error ? <span className="sr-only">{state.error}</span> : null}
    </form>
  );
}

function DeleteButton({ albumId, sticker }: { albumId: string; sticker: Sticker }) {
  const [state, formAction, pending] = useActionState(
    deleteStickerAction,
    {} as CatalogActionState,
  );
  const label = `Eliminar lámina ${sticker.code}`;
  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(event) => {
        if (!window.confirm(`¿Eliminar la lámina ${sticker.code}?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="albumId" value={albumId} />
      <input type="hidden" name="stickerId" value={sticker.id} />
      <button className={dangerButton} disabled={pending} aria-label={label} title={label}>
        Eliminar
      </button>
      {state.error ? <span className="sr-only">{state.error}</span> : null}
    </form>
  );
}

function EditHint() {
  return (
    <span className="invisible text-primary group-hover/row:visible group-focus-within/row:visible">
      <PencilIcon />
    </span>
  );
}

/**
 * Compact list designed for real albums (roughly 240 stickers). Only the active
 * cell mounts an editor; the other rows remain lightweight read-only cells.
 */
export function StickerTable({
  albumId,
  stickers,
  pages,
}: {
  albumId: string;
  stickers: Sticker[];
  pages: PageOption[];
}) {
  const [active, setActive] = useState<ActiveCell>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const savingRef = useRef(false);
  const cancelRef = useRef(false);
  const pageName = new Map(pages.map((page) => [page.id, page.name]));

  function open(sticker: Sticker, editableField: EditableField) {
    cancelRef.current = false;
    setActive({ stickerId: sticker.id, field: editableField });
    setDraft(
      editableField === "code"
        ? sticker.code
        : editableField === "name"
          ? (sticker.name ?? "")
          : (sticker.sectionId ?? ""),
    );
    setError(undefined);
  }

  function cancel() {
    cancelRef.current = true;
    setActive(null);
    setDraft("");
    setError(undefined);
  }

  function save(sticker: Sticker, editableField: EditableField, value: string) {
    if (savingRef.current) return;
    const normalized = editableField === "page" ? value : value.trim();
    const original = editableField === "code"
      ? sticker.code
      : editableField === "name"
        ? (sticker.name ?? "")
        : (sticker.sectionId ?? "");
    if (normalized === original) {
      cancel();
      return;
    }
    if (editableField === "code" && !normalized) {
      setDraft(sticker.code);
      setError("El código es obligatorio.");
      return;
    }

    const data = new FormData();
    data.set("albumId", albumId);
    data.set("stickerId", sticker.id);
    data.set("code", editableField === "code" ? normalized : sticker.code);
    data.set("name", editableField === "name" ? normalized : (sticker.name ?? ""));
    data.set("sectionId", editableField === "page" ? normalized : (sticker.sectionId ?? ""));

    savingRef.current = true;
    startTransition(async () => {
      const result = await updateStickerAction({}, data);
      savingRef.current = false;
      if (result.error) {
        setDraft(original);
        setError(result.error);
        setActive({ stickerId: sticker.id, field: editableField });
        return;
      }
      cancel();
    });
  }

  function isActive(sticker: Sticker, editableField: EditableField) {
    return active?.stickerId === sticker.id && active.field === editableField;
  }

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-muted">
            <th className="w-16 px-3 py-2 font-medium">Orden</th>
            <th className="w-32 px-3 py-2 font-medium">Código</th>
            <th className="px-3 py-2 font-medium">Nombre</th>
            <th className="w-52 px-3 py-2 font-medium">Página</th>
            <th className="w-40 px-3 py-2 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {stickers.map((sticker, index) => (
            <tr className="group/row border-b border-border hover:bg-surface-muted last:border-b-0" key={sticker.id}>
              <td className="px-3 py-1 text-xs text-muted">#{sticker.position}</td>
              <td className="px-3 py-1">
                {isActive(sticker, "code") ? (
                  <div>
                    <input
                      autoFocus
                      className={`${field} font-mono`}
                      value={draft}
                      maxLength={64}
                      disabled={pending}
                      aria-label={`Código de la lámina ${sticker.code}`}
                      aria-invalid={Boolean(error)}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") { event.preventDefault(); save(sticker, "code", draft); }
                        if (event.key === "Escape") { event.preventDefault(); cancel(); }
                      }}
                      onBlur={() => {
                        if (cancelRef.current) { cancelRef.current = false; return; }
                        save(sticker, "code", draft);
                      }}
                    />
                    {error ? <p className="mt-1 text-xs text-danger" role="alert">{error}</p> : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded text-left hover:text-primary"
                    onClick={() => open(sticker, "code")}
                    aria-label={`Editar código ${sticker.code}`}
                    title="Editar código"
                  >
                    <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">{sticker.code}</span>
                    <EditHint />
                  </button>
                )}
              </td>
              <td className="px-3 py-1">
                {isActive(sticker, "name") ? (
                  <div>
                    <input
                      autoFocus
                      className={field}
                      value={draft}
                      maxLength={160}
                      disabled={pending}
                      aria-label={`Nombre de la lámina ${sticker.code}`}
                      aria-invalid={Boolean(error)}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") { event.preventDefault(); save(sticker, "name", draft); }
                        if (event.key === "Escape") { event.preventDefault(); cancel(); }
                      }}
                      onBlur={() => {
                        if (cancelRef.current) { cancelRef.current = false; return; }
                        save(sticker, "name", draft);
                      }}
                    />
                    {error ? <p className="mt-1 text-xs text-danger" role="alert">{error}</p> : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded text-left hover:text-primary"
                    onClick={() => open(sticker, "name")}
                    aria-label={`Editar nombre de la lámina ${sticker.code}`}
                    title="Editar nombre"
                  >
                    <span className={sticker.name ? "" : "text-muted"}>{sticker.name ?? "—"}</span>
                    <EditHint />
                  </button>
                )}
              </td>
              <td className="px-3 py-1">
                {isActive(sticker, "page") ? (
                  <div>
                    <select
                      autoFocus
                      className={field}
                      value={draft}
                      disabled={pending}
                      aria-label={`Página de la lámina ${sticker.code}`}
                      aria-invalid={Boolean(error)}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        save(sticker, "page", event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") { event.preventDefault(); cancel(); }
                      }}
                      onBlur={() => {
                        if (cancelRef.current) { cancelRef.current = false; return; }
                        if (!savingRef.current) cancel();
                      }}
                    >
                      <option value="">Sin página asignada</option>
                      {pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
                    </select>
                    {error ? <p className="mt-1 text-xs text-danger" role="alert">{error}</p> : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded text-left hover:text-primary"
                    onClick={() => open(sticker, "page")}
                    aria-label={`Editar página de la lámina ${sticker.code}`}
                    title="Editar página"
                  >
                    <span className={sticker.sectionId ? "" : "text-muted"}>
                      {sticker.sectionId ? (pageName.get(sticker.sectionId) ?? "Sin página asignada") : "Sin página asignada"}
                    </span>
                    <EditHint />
                  </button>
                )}
              </td>
              <td className="px-3 py-1">
                <div className="flex items-center gap-1">
                  <MoveButton albumId={albumId} stickerId={sticker.id} direction="up" label={`Subir ${sticker.code}`} disabled={index === 0} />
                  <MoveButton albumId={albumId} stickerId={sticker.id} direction="down" label={`Bajar ${sticker.code}`} disabled={index === stickers.length - 1} />
                  <DeleteButton albumId={albumId} sticker={sticker} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
