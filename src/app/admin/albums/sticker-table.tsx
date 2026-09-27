"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { Sticker } from "@/lib/catalog/service";
import {
  bulkAssignStickerSectionAction,
  bulkDeleteStickersAction,
  deleteStickerAction,
  moveStickerAction,
  updateStickerAction,
  type CatalogActionState,
} from "./actions";

const field =
  "w-full min-w-0 rounded border border-input-border bg-input px-2 py-1 text-sm text-content";
const iconButton =
  "rounded border border-border bg-surface px-2 py-0.5 text-xs text-content hover:bg-surface-muted disabled:opacity-40";
const dangerButton =
  "rounded border border-border bg-surface px-2 py-0.5 text-xs text-danger hover:bg-surface-muted";
const primaryButton =
  "rounded bg-primary px-2 py-1 text-sm text-primary-text hover:underline disabled:opacity-50";

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
 *
 * Selection is a temporary, in-memory UI state: nothing leaves the browser
 * unless the user explicitly runs an assign/delete through the bulk bar.
 * Authorization, ownership validation and atomicity all stay on the server.
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [rangeError, setRangeError] = useState<string>();
  const [destination, setDestination] = useState<string>("");
  const selectAllRef = useRef<HTMLInputElement>(null);
  const pageName = new Map(pages.map((page) => [page.id, page.name]));

  // Sort by visible position so the range picker matches what the user sees.
  const ordered = useMemo(
    () => [...stickers].sort((a, b) => a.position - b.position),
    [stickers],
  );

  // Sync the indeterminate state (the property cannot be set declaratively in
  // JSX for a controlled checkbox).
  const allChecked = ordered.length > 0 && selected.size === ordered.length;
  const someChecked = selected.size > 0 && !allChecked;
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someChecked;
  }, [someChecked]);

  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        if (!checked) {
          if (prev.size === 0) return prev;
          return new Set();
        }
        const next = new Set(prev);
        for (const sticker of ordered) next.add(sticker.id);
        return next;
      });
    },
    [ordered],
  );

  function applyRange(fromRaw: string, toRaw: string) {
    setRangeError(undefined);
    const from = Number(fromRaw);
    const to = Number(toRaw);
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      setRangeError("Desde y Hasta deben ser números enteros.");
      return;
    }
    if (from < 1 || to < from) {
      setRangeError("El rango debe estar entre 1 y el final del inventario.");
      return;
    }
    if (ordered.length === 0) {
      setRangeError("No hay láminas para seleccionar.");
      return;
    }
    if (to > ordered.length) {
      setRangeError(`Hasta no puede superar ${ordered.length}.`);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      for (let index = from - 1; index < to; index += 1) {
        next.add(ordered[index].id);
      }
      return next;
    });
  }

  function open(sticker: Sticker, editableField: EditableField) {
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
    setActive(null);
    setDraft("");
    setError(undefined);
  }

  function save(sticker: Sticker, editableField: EditableField, value: string) {
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

    startTransition(async () => {
      const result = await updateStickerAction({}, data);
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

  const [assignState, assignAction, assignPending] = useActionState(
    bulkAssignStickerSectionAction,
    {} as CatalogActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    bulkDeleteStickersAction,
    {} as CatalogActionState,
  );
  const bulkError = assignState.error || deleteState.error;
  const bulkSuccess = !bulkError && (assignState.success || deleteState.success);
  const bulkPending = assignPending || deletePending || pending;

  // Clear the selection on successful bulk operations so the user can move on
  // to the next batch without having to deselect manually.
  useEffect(() => {
    if (assignState.success) {
      setSelected(new Set());
      setDestination("");
    }
  }, [assignState.success]);
  useEffect(() => {
    if (deleteState.success) setSelected(new Set());
  }, [deleteState.success]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex max-w-full flex-col gap-2 rounded border border-border bg-surface p-2 text-sm sm:flex-row sm:flex-wrap sm:items-center">
        <span className="shrink-0 font-medium text-content">Seleccionar rango</span>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:items-center">
          <label className="flex min-w-0 items-center gap-1 text-muted">
            <span className="shrink-0">Desde</span>
            <input
              className={field}
              type="number"
              min={1}
              value={rangeFrom}
              onChange={(event) => setRangeFrom(event.target.value)}
              aria-label="Seleccionar desde"
            />
          </label>
          <label className="flex min-w-0 items-center gap-1 text-muted">
            <span className="shrink-0">Hasta</span>
            <input
              className={field}
              type="number"
              min={1}
              value={rangeTo}
              onChange={(event) => setRangeTo(event.target.value)}
              aria-label="Seleccionar hasta"
            />
          </label>
        </div>
        <button
          type="button"
          className={iconButton}
          onClick={() => applyRange(rangeFrom, rangeTo)}
        >
          Seleccionar
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:ml-auto">
          <span className="whitespace-nowrap text-muted">
            {selected.size} {selected.size === 1 ? "seleccionada" : "seleccionadas"}
          </span>
          {selected.size > 0 ? (
            <button
              type="button"
              className={iconButton}
              onClick={() => setSelected(new Set())}
            >
              Limpiar selección
            </button>
          ) : null}
        </div>
        {rangeError ? (
          <span className="w-full text-xs text-danger">{rangeError}</span>
        ) : null}
      </div>

      {selected.size > 0 ? (
        <form
          action={assignAction}
          className="flex min-w-0 flex-col gap-2 rounded border border-border bg-surface-muted p-2 text-sm sm:flex-row sm:flex-wrap sm:items-center"
        >
          <input type="hidden" name="albumId" value={albumId} />
          <input type="hidden" name="stickerIds" value={selectedIds.join(",")} />
          <span className="shrink-0 font-medium">
            {selected.size} {selected.size === 1 ? "seleccionada" : "seleccionadas"}
          </span>
          <label className="flex min-w-0 flex-1 items-center gap-1 text-muted sm:max-w-md">
            <span className="shrink-0">Asignar a</span>
            <select
              className={field}
              name="sectionId"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            >
              <option value="">Sin página asignada</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button className={primaryButton} disabled={bulkPending}>
              Asignar
            </button>
            <button
              type="button"
              className={dangerButton}
              disabled={bulkPending}
              onClick={(event) => {
                const form = (event.currentTarget.closest("form")?.parentElement)
                  ?.querySelector("form[data-bulk-delete]") as HTMLFormElement | null;
                const message =
                  selected.size === 1
                    ? "¿Eliminar la 1 lámina seleccionada?"
                    : `¿Eliminar las ${selected.size} láminas seleccionadas?`;
                if (!window.confirm(message)) event.preventDefault();
                if (form) form.submit();
              }}
            >
              Eliminar seleccionadas
            </button>
          </div>
          {bulkError ? <span className="w-full text-xs text-danger">{bulkError}</span> : null}
          {bulkSuccess ? <span className="w-full text-xs text-success">{assignState.success ?? deleteState.success}</span> : null}
        </form>
      ) : null}

      <form
        action={deleteAction}
        data-bulk-delete
        onSubmit={(event) => {
          if (selected.size === 0) {
            event.preventDefault();
            return;
          }
          const message =
            selected.size === 1
              ? "¿Eliminar la 1 lámina seleccionada?"
              : `¿Eliminar las ${selected.size} láminas seleccionadas?`;
          if (!window.confirm(message)) event.preventDefault();
        }}
        className="hidden"
      >
        <input type="hidden" name="albumId" value={albumId} />
        <input type="hidden" name="stickerIds" value={selectedIds.join(",")} />
        <button type="submit" tabIndex={-1} aria-hidden="true">submit</button>
      </form>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-muted">
              <th className="w-10 px-3 py-2 font-medium">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  aria-label="Seleccionar todas las láminas visibles"
                  className="h-4 w-4 cursor-pointer"
                  checked={allChecked}
                  onChange={(event) => toggleAll(event.currentTarget.checked)}
                />
              </th>
              <th className="w-16 px-3 py-2 font-medium">Orden</th>
              <th className="w-32 px-3 py-2 font-medium">Código</th>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="w-52 px-3 py-2 font-medium">Página</th>
              <th className="w-40 px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((sticker, index) => (
              <tr className="group/row border-b border-border hover:bg-surface-muted last:border-b-0" key={sticker.id}>
                <td className="px-3 py-1">
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar lámina ${sticker.code}`}
                    className="h-4 w-4 cursor-pointer"
                    checked={selected.has(sticker.id)}
                    onChange={(event) => toggleOne(sticker.id, event.currentTarget.checked)}
                  />
                </td>
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
                          if (active?.stickerId !== sticker.id) return;
                          if (active.field !== "code") return;
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
                          if (active?.stickerId !== sticker.id) return;
                          if (active.field !== "name") return;
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
                          if (active?.stickerId !== sticker.id) return;
                          if (active.field !== "page") return;
                          if (!pending) cancel();
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
                    <MoveButton albumId={albumId} stickerId={sticker.id} direction="down" label={`Bajar ${sticker.code}`} disabled={index === ordered.length - 1} />
                    <DeleteButton albumId={albumId} sticker={sticker} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
