"use client";

import type { UserAlbumDetail } from "@/lib/collection/service";
import { adjustQuantityAction } from "../actions";
import { QuantityButton } from "../quantity-button";

type Sticker = UserAlbumDetail["unassigned"][number];

type StickerState = { label: string; token: string; textClass: string; quantityLabel?: string };

function stickerState(quantity: number): StickerState {
  if (quantity === 0) return { label: "Faltante", token: "var(--album-sticker-missing)", textClass: "text-muted" };
  if (quantity === 1) return { label: "Obtenida", token: "var(--album-sticker-owned)", textClass: "text-success" };
  return { label: "Repetida", token: "var(--album-sticker-duplicate)", textClass: "text-accent", quantityLabel: `×${quantity}` };
}

function QuantityFields({ userAlbumId, stickerId, change }: { userAlbumId: string; stickerId: string; change: "increment" | "decrement" }) {
  return <>
    <input name="userAlbumId" type="hidden" value={userAlbumId} />
    <input name="stickerId" type="hidden" value={stickerId} />
    <input name="change" type="hidden" value={change} />
  </>;
}

function QuantityControls({ sticker, userAlbumId }: { sticker: Sticker; userAlbumId: string }) {
  return (
    <div className="flex items-center gap-2">
      <form action={adjustQuantityAction}>
        <QuantityFields change="decrement" stickerId={sticker.id} userAlbumId={userAlbumId} />
        <QuantityButton disabled={sticker.quantity === 0} label={`Quitar copia de lámina ${sticker.code}`}>−</QuantityButton>
      </form>
      <span aria-label={`${sticker.quantity} copias`} className="min-w-7 text-center font-semibold tabular-nums">{sticker.quantity}</span>
      <form action={adjustQuantityAction}>
        <QuantityFields change="increment" stickerId={sticker.id} userAlbumId={userAlbumId} />
        <QuantityButton disabled={sticker.quantity >= 1000} label={`Añadir copia de lámina ${sticker.code}`}>+</QuantityButton>
      </form>
    </div>
  );
}

export function StickerCard({ sticker, userAlbumId, view }: { sticker: Sticker; userAlbumId: string; view: "grid" | "list" }) {
  const state = stickerState(sticker.quantity);
  const identity = <div className="min-w-0">
    <code className="block truncate text-base font-semibold" title={sticker.code}>{sticker.code}</code>
    {sticker.name ? <p className="truncate text-sm text-muted" title={sticker.name}>{sticker.name}</p> : null}
  </div>;
  const status = <div className={`flex items-center gap-2 text-sm font-medium ${state.textClass}`}>
    <span>{state.label}</span>
    {state.quantityLabel ? <strong className="text-lg tabular-nums">{state.quantityLabel}</strong> : null}
  </div>;

  if (view === "list") return (
    <li className="relative flex min-w-0 flex-col gap-3 overflow-hidden px-3 py-3 sm:flex-row sm:items-center">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: state.token }} />
      <div className="sm:flex-1">{identity}</div>
      {status}
      <QuantityControls sticker={sticker} userAlbumId={userAlbumId} />
    </li>
  );

  return (
    <li className="relative flex min-h-40 min-w-0 flex-col gap-3 overflow-hidden rounded-sticker border border-border bg-surface p-3">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: state.token }} />
      {identity}
      <div className="mt-auto">{status}</div>
      <QuantityControls sticker={sticker} userAlbumId={userAlbumId} />
    </li>
  );
}
