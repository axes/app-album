"use client";

import type { CSSProperties } from "react";
import type { UserAlbumDetail } from "@/lib/collection/service";
import { adjustQuantityAction } from "../actions";
import { QuantityButton } from "../quantity-button";

type Sticker = UserAlbumDetail["unassigned"][number];

/**
 * UI-05C.2 — one semantic state per sticker, derived exclusively from
 * `quantity`. `surfaceMix` and `borderMix` are percentages of the state token
 * blended into the neutral surface and border through `color-mix()`, so the
 * card tint always comes from the token and never from a literal colour.
 */
type StickerState = {
  label: string;
  token: string;
  textClass: string;
  surfaceMix: number;
  borderMix: number;
};

function stickerState(quantity: number): StickerState {
  if (quantity === 0) {
    return {
      label: "Faltante",
      token: "var(--album-sticker-missing)",
      textClass: "text-xs font-medium text-muted",
      surfaceMix: 0,
      borderMix: 0,
    };
  }
  if (quantity === 1) {
    return {
      label: "Obtenida",
      token: "var(--album-sticker-owned)",
      textClass: "text-xs font-semibold text-success",
      surfaceMix: 10,
      borderMix: 40,
    };
  }
  return {
    label: `Repetida · ${quantity} copias`,
    token: "var(--album-sticker-duplicate)",
    textClass: "text-sm font-bold text-accent",
    surfaceMix: 18,
    borderMix: 65,
  };
}

function QuantityFields({ userAlbumId, stickerId, change }: { userAlbumId: string; stickerId: string; change: "increment" | "decrement" }) {
  return <>
    <input name="userAlbumId" type="hidden" value={userAlbumId} />
    <input name="stickerId" type="hidden" value={stickerId} />
    <input name="change" type="hidden" value={change} />
  </>;
}

/**
 * `stretch` is the mosaic layout: the two 44 px targets share the card width
 * and the count lives in the state label, so the row never overflows a
 * ~112 px track. The list layout keeps the explicit counter between them.
 */
function QuantityControls({ sticker, userAlbumId, stretch = false }: { sticker: Sticker; userAlbumId: string; stretch?: boolean }) {
  return (
    <div className={`flex items-center ${stretch ? "gap-1" : "gap-2"}`}>
      <form action={adjustQuantityAction} className={stretch ? "flex-1" : undefined}>
        <QuantityFields change="decrement" stickerId={sticker.id} userAlbumId={userAlbumId} />
        <QuantityButton disabled={sticker.quantity === 0} label={`Quitar copia de lámina ${sticker.code}`} stretch={stretch}>−</QuantityButton>
      </form>
      {stretch ? null : (
        <span aria-label={`${sticker.quantity} copias`} className="min-w-7 text-center font-semibold tabular-nums">{sticker.quantity}</span>
      )}
      <form action={adjustQuantityAction} className={stretch ? "flex-1" : undefined}>
        <QuantityFields change="increment" stickerId={sticker.id} userAlbumId={userAlbumId} />
        <QuantityButton disabled={sticker.quantity >= 1000} label={`Añadir copia de lámina ${sticker.code}`} stretch={stretch}>+</QuantityButton>
      </form>
    </div>
  );
}

export function StickerCard({ sticker, userAlbumId, view }: { sticker: Sticker; userAlbumId: string; view: "grid" | "list" }) {
  const state = stickerState(sticker.quantity);
  const tinted = state.surfaceMix > 0;
  const tint: CSSProperties | undefined = tinted
    ? {
        backgroundColor: `color-mix(in srgb, ${state.token} ${state.surfaceMix}%, var(--album-surface))`,
        borderColor: `color-mix(in srgb, ${state.token} ${state.borderMix}%, var(--album-border))`,
      }
    : undefined;

  const identity = <div className="min-w-0">
    <code className="block truncate text-base font-bold leading-tight" title={sticker.code}>{sticker.code}</code>
    {sticker.name ? <p className="truncate text-xs text-muted" title={sticker.name}>{sticker.name}</p> : null}
  </div>;
  const status = <span className={`block leading-snug ${state.textClass}`}>{state.label}</span>;

  if (view === "list") return (
    <li className="relative flex min-w-0 flex-col gap-3 overflow-hidden px-3 py-3 sm:flex-row sm:items-center">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: state.token }} />
      <div className="sm:flex-1">{identity}</div>
      {status}
      <QuantityControls sticker={sticker} userAlbumId={userAlbumId} />
    </li>
  );

  return (
    <li
      className={`relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-sticker border p-2.5 ${tinted ? "border-border bg-surface" : "border-dashed border-border bg-surface-muted"}`}
      style={tint}
    >
      {tinted ? <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: state.token }} /> : null}
      {identity}
      <div className="mt-auto flex flex-col gap-2">
        {status}
        <QuantityControls sticker={sticker} userAlbumId={userAlbumId} stretch />
      </div>
    </li>
  );
}
