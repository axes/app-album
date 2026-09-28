"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { UserAlbumDetail } from "@/lib/collection/service";
import { adjustQuantityAction } from "../actions";
import { QuantityButton } from "../quantity-button";

type Sticker = UserAlbumDetail["unassigned"][number];
type StickerGroup = { id: string; name: string; stickers: Sticker[] };
type ViewMode = "grid" | "list";

function quantityStatus(quantity: number): { label: string; className: string } {
  if (quantity === 0) return { label: "Faltante", className: "text-muted" };
  if (quantity === 1) return { label: "Obtenida", className: "text-success" };
  const duplicates = quantity - 1;
  return {
    label: `${duplicates} ${duplicates === 1 ? "repetida" : "repetidas"}`,
    className: "text-primary",
  };
}

function QuantityFields({ userAlbumId, stickerId, change }: { userAlbumId: string; stickerId: string; change: "increment" | "decrement" }) {
  return (
    <>
      <input name="userAlbumId" type="hidden" value={userAlbumId} />
      <input name="stickerId" type="hidden" value={stickerId} />
      <input name="change" type="hidden" value={change} />
    </>
  );
}

function MissingStickerButton({ sticker }: { sticker: Sticker }) {
  const { pending } = useFormStatus();
  return (
    <button
      aria-label={`Marcar lámina ${sticker.code} como obtenida`}
      className="flex min-h-32 w-full cursor-pointer flex-col items-start rounded border border-border bg-surface p-3 text-left text-content transition hover:border-primary hover:bg-surface-muted disabled:cursor-wait disabled:text-muted"
      disabled={pending}
      type="submit"
    >
      <span className="max-w-full truncate font-mono text-lg font-semibold leading-tight" title={sticker.code}>{sticker.code}</span>
      {sticker.name ? <span className="mt-1 max-w-full truncate text-sm text-muted" title={sticker.name}>{sticker.name}</span> : null}
      <span className="mt-auto pt-3 text-xs text-muted">Faltante</span>
      <span className="mt-1 text-sm font-medium text-primary">{pending ? "Añadiendo…" : "+ Añadir"}</span>
    </button>
  );
}

function QuantityControls({ sticker, userAlbumId }: { sticker: Sticker; userAlbumId: string }) {
  return (
    <div className="flex items-center gap-2">
      <form action={adjustQuantityAction}>
        <QuantityFields userAlbumId={userAlbumId} stickerId={sticker.id} change="decrement" />
        <QuantityButton disabled={sticker.quantity === 0} label={`Quitar copia de ${sticker.code}`}>−</QuantityButton>
      </form>
      <span aria-label={`${sticker.quantity} copias`} className="min-w-6 text-center font-semibold tabular-nums">
        {sticker.quantity}
      </span>
      <form action={adjustQuantityAction}>
        <QuantityFields userAlbumId={userAlbumId} stickerId={sticker.id} change="increment" />
        <QuantityButton disabled={sticker.quantity >= 1000} label={`Añadir copia de ${sticker.code}`}>+</QuantityButton>
      </form>
    </div>
  );
}

function StickerTile({ sticker, userAlbumId }: { sticker: Sticker; userAlbumId: string }) {
  if (sticker.quantity === 0) {
    return (
      <li className="min-w-0">
        <form action={adjustQuantityAction}>
          <QuantityFields userAlbumId={userAlbumId} stickerId={sticker.id} change="increment" />
          <MissingStickerButton sticker={sticker} />
        </form>
      </li>
    );
  }

  const status = quantityStatus(sticker.quantity);
  return (
    <li className="flex min-h-32 min-w-0 flex-col rounded border border-border bg-surface p-3">
      <code className="truncate text-lg font-semibold leading-tight" title={sticker.code}>{sticker.code}</code>
      {sticker.name ? <p className="mt-1 truncate text-sm text-muted" title={sticker.name}>{sticker.name}</p> : null}
      <p className={`mt-auto pt-3 text-xs font-medium ${status.className}`}>{status.label}</p>
      <div className="mt-2"><QuantityControls sticker={sticker} userAlbumId={userAlbumId} /></div>
    </li>
  );
}

function StickerRow({ sticker, userAlbumId }: { sticker: Sticker; userAlbumId: string }) {
  const status = quantityStatus(sticker.quantity);
  return (
    <li className="grid grid-cols-[minmax(4rem,auto)_1fr_auto] items-center gap-3 border-t border-border px-3 py-2 first:border-t-0">
      <code className="truncate text-sm font-semibold" title={sticker.code}>{sticker.code}</code>
      <div className="min-w-0">
        {sticker.name ? <p className="truncate text-sm" title={sticker.name}>{sticker.name}</p> : null}
        <p className={`text-xs ${status.className}`}>{status.label}</p>
      </div>
      <QuantityControls sticker={sticker} userAlbumId={userAlbumId} />
    </li>
  );
}

function Group({ group, userAlbumId, view }: { group: StickerGroup; userAlbumId: string; view: ViewMode }) {
  const owned = group.stickers.filter((sticker) => sticker.quantity > 0).length;
  return (
    <details className="rounded border border-border bg-surface">
      <summary className="cursor-pointer px-4 py-3 font-medium">
        {group.name} — {owned} / {group.stickers.length}
      </summary>
      {view === "grid" ? (
        <ul className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {group.stickers.map((sticker) => <StickerTile key={sticker.id} sticker={sticker} userAlbumId={userAlbumId} />)}
        </ul>
      ) : (
        <ul className="border-t border-border">
          {group.stickers.map((sticker) => <StickerRow key={sticker.id} sticker={sticker} userAlbumId={userAlbumId} />)}
        </ul>
      )}
    </details>
  );
}

export function StickerCollection({ groups, userAlbumId }: { groups: StickerGroup[]; userAlbumId: string }) {
  const [view, setView] = useState<ViewMode>("grid");
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Láminas</h2>
        <div aria-label="Vista de láminas" className="inline-flex rounded border border-border bg-surface p-1" role="group">
          <button
            aria-pressed={view === "grid"}
            className={`min-h-10 rounded px-3 py-1 text-sm font-medium ${view === "grid" ? "bg-primary text-primary-text" : "text-content hover:bg-surface-muted"}`}
            onClick={() => setView("grid")}
            type="button"
          >
            ▦ Mosaico
          </button>
          <button
            aria-pressed={view === "list"}
            className={`min-h-10 rounded px-3 py-1 text-sm font-medium ${view === "list" ? "bg-primary text-primary-text" : "text-content hover:bg-surface-muted"}`}
            onClick={() => setView("list")}
            type="button"
          >
            ☷ Lista
          </button>
        </div>
      </div>
      {groups.map((group) => <Group key={group.id} group={group} userAlbumId={userAlbumId} view={view} />)}
    </div>
  );
}
