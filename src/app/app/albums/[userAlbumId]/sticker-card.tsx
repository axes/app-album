"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { animate } from "motion/react";
import type { UserAlbumDetail } from "@/lib/collection/service";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Icon } from "@/components/ui/icons";
import { adjustQuantityAction } from "../actions";
import { QuantityButton } from "../quantity-button";
import { StickerMotionLayer } from "./sticker-motion-layer";
import {
  CLEAR_MS,
  DURATION_S,
  MOTION_EASE,
  intentFor,
  isCelebration,
  type Intent,
} from "./sticker-interaction";

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
 *
 * Below `sm` the mosaic is denser (four tiles per phone row): the increment
 * button covers the whole tile and the decrement button keeps its own 44 px
 * box above it. Both remain the same two real submit buttons, so the forms,
 * the Server Action and the accessible names do not change.
 *
 * UI-05C.3 — `onIntent` belongs to the real submit button, not to the form.
 * It therefore runs only for an explicit valid `+` or `−` click and never for
 * clicks on the card or form spacing. The form remains the sole owner of the
 * Server Action; the payload and submission path are untouched.
 *
 * `disabled` is derived from the authoritative server quantity, never from the
 * optimistic `displayed` value. If the button flipped to `disabled` while the
 * optimistic update was being committed, the browser would cancel the pending
 * form submission and the Server Action would never run — which is exactly how
 * a `1 → 0` decrement used to be lost. The optimistic value still drives the
 * label and the counter, so the feedback stays immediate.
 */
function QuantityControls({
  sticker,
  userAlbumId,
  displayed,
  serverQuantity,
  stretch = false,
  onIntent,
}: {
  sticker: Sticker;
  userAlbumId: string;
  displayed: number;
  serverQuantity: number;
  stretch?: boolean;
  onIntent: (change: "increment" | "decrement") => void;
}) {
  // Below `sm` the mosaic drops the decrement control for a sticker the
  // server does not hold yet (there is nothing to remove), so the tile stays
  // compact. It follows the authoritative quantity, like `disabled` above.
  const decrementForm = stretch
    ? `flex-1 max-sm:flex-none${serverQuantity === 0 ? " max-sm:hidden" : ""}`
    : undefined;
  return (
    <div className={`flex items-center ${stretch ? "gap-1 max-sm:min-h-11" : "gap-2"}`}>
      <form action={adjustQuantityAction} className={decrementForm}>
        <QuantityFields change="decrement" stickerId={sticker.id} userAlbumId={userAlbumId} />
        <QuantityButton compact={stretch ? "raised" : undefined} disabled={serverQuantity === 0} label={`Quitar copia de lámina ${sticker.code}`} onIntent={() => onIntent("decrement")} stretch={stretch}>
          <Icon className="block shrink-0" name="remove" size="md" />
        </QuantityButton>
      </form>
      {stretch ? null : (
        <span aria-label={`${displayed} copias`} className="min-w-7 text-center font-semibold tabular-nums">{displayed}</span>
      )}
      <form action={adjustQuantityAction} className={stretch ? "flex-1 max-sm:flex-none" : undefined}>
        <QuantityFields change="increment" stickerId={sticker.id} userAlbumId={userAlbumId} />
        <QuantityButton compact={stretch ? "cover" : undefined} disabled={serverQuantity >= 1000} label={`Añadir copia de lámina ${sticker.code}`} onIntent={() => onIntent("increment")} stretch={stretch}>
          <Icon className="block shrink-0" name="add" size="md" />
        </QuantityButton>
      </form>
    </div>
  );
}

export function StickerCard({ sticker, userAlbumId, view }: { sticker: Sticker; userAlbumId: string; view: "grid" | "list" }) {
  const cardRef = useRef<HTMLLIElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  /**
   * Optimistic overlay. `null` means "no overlay, the server value wins".
   * It is cleared during render whenever a new authoritative sticker prop
   * arrives. Tracking the prop object, rather than only its numeric quantity,
   * also recognizes an explicit server rollback to the previous number.
   */
  const [optimistic, setOptimistic] = useState<number | null>(null);
  const [serverSticker, setServerSticker] = useState(sticker);
  const [animation, setAnimation] = useState<{ id: number; intent: Intent } | null>(null);

  if (serverSticker !== sticker) {
    setServerSticker(sticker);
    setOptimistic(null);
  }

  const displayed = optimistic ?? sticker.quantity;
  const state = stickerState(displayed);
  const tinted = state.surfaceMix > 0;
  const tint: CSSProperties | undefined = tinted
    ? {
        backgroundColor: `color-mix(in srgb, ${state.token} ${state.surfaceMix}%, var(--album-surface))`,
        borderColor: `color-mix(in srgb, ${state.token} ${state.borderMix}%, var(--album-border))`,
      }
    : undefined;

  /**
   * The animation is driven by the click, never by the `quantity` prop. This
   * effect only reacts to `animation`, which is set exclusively inside
   * `handleIntent`, so an incoming RSC, a refresh, a view toggle or a
   * navigation can never trigger a celebration.
   */
  useEffect(() => {
    if (!animation) return;
    const { intent } = animation;
    const controls: Array<{ stop: () => void }> = [];

    if (!reduced) {
      const card = cardRef.current;
      const label = labelRef.current;
      if (intent === "obtained" && card) {
        controls.push(animate(card, { scale: [1, 1.07, 1] }, { duration: DURATION_S.obtained, ease: MOTION_EASE }));
        if (label) controls.push(animate(label, { scale: [0.9, 1] }, { duration: 0.2, ease: MOTION_EASE }));
      } else if (intent === "duplicate" && card) {
        controls.push(animate(card, { scale: [1, 1.04, 1] }, { duration: DURATION_S.duplicate, ease: MOTION_EASE }));
      } else if (intent === "increment" && label) {
        controls.push(animate(label, { scale: [1, 1.12, 1] }, { duration: DURATION_S.increment, ease: MOTION_EASE }));
      } else if (intent === "decrement" && label) {
        controls.push(animate(label, { scale: [1, 0.94, 1] }, { duration: DURATION_S.decrement, ease: MOTION_EASE }));
      } else if (intent === "lost" && card) {
        controls.push(animate(card, { opacity: [1, 0.85, 1], scale: [1, 0.98, 1] }, { duration: DURATION_S.lost, ease: MOTION_EASE }));
      }
    }

    const timer = setTimeout(() => setAnimation(null), CLEAR_MS[intent]);
    return () => {
      for (const control of controls) control.stop();
      clearTimeout(timer);
    };
  }, [animation, reduced]);

  function handleIntent(change: "increment" | "decrement") {
    const from = displayed;
    const to = change === "increment" ? from + 1 : from - 1;
    // The overlay is clamped at zero so a repeated decrement can never render a
    // negative quantity. The server remains the authority on the real value.
    setOptimistic(Math.max(0, to));
    setAnimation((previous) => ({ id: (previous?.id ?? 0) + 1, intent: intentFor(from, to) }));
  }

  const grid = view === "grid";
  // Mosaic below `sm`: the whole tile is the "add a copy" target (see
  // `QuantityButton` `compact`), so the text sits above that layer without
  // intercepting taps, the sticker name is dropped and the state collapses to
  // a short mark in the top-right corner. The full label stays in the markup
  // for assistive technology.
  const identity = <div className={`min-w-0${grid ? " max-sm:pointer-events-none max-sm:relative max-sm:z-10 max-sm:pr-7" : ""}`}>
    <code className="type-sticker-number block truncate leading-tight" title={sticker.code}>{sticker.code}</code>
    {sticker.name ? <p className={`${grid ? "max-sm:hidden " : ""}truncate text-xs text-muted`} title={sticker.name}>{sticker.name}</p> : null}
  </div>;
  const status = grid ? (
    <>
      <span ref={labelRef} className={`block leading-snug ${state.textClass} max-sm:sr-only`}>{state.label}</span>
      {displayed > 0 ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-1.5 top-1.5 z-10 leading-snug sm:hidden ${state.textClass}`}
          data-testid="sticker-compact-state"
        >
          {displayed === 1 ? <Icon className="block" name="owned" size="sm" /> : `×${displayed}`}
        </span>
      ) : null}
    </>
  ) : (
    <span ref={labelRef} className={`block leading-snug ${state.textClass}`}>{state.label}</span>
  );

  /**
   * UI-05C.3 — celebrations are mosaic-only. The list view stays a stable,
   * management-oriented surface: it keeps the optimistic update, the label,
   * the counter and the state colour, but never mounts the decorative layer
   * and never plays a card pop or bounce.
   */
  const celebrating = view === "grid" && !reduced && animation !== null && isCelebration(animation.intent);
  const layer = celebrating ? <StickerMotionLayer intent={animation.intent} /> : null;

  if (view === "list") return (
    <li className="relative flex min-w-0 flex-col gap-3 overflow-hidden px-3 py-3 sm:flex-row sm:items-center">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: state.token }} />
      <div className="sm:flex-1">{identity}</div>
      {status}
      <QuantityControls sticker={sticker} userAlbumId={userAlbumId} displayed={displayed} serverQuantity={sticker.quantity} onIntent={handleIntent} />
    </li>
  );

  return (
    <li
      ref={cardRef}
      className={`relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-sticker border p-2.5 max-sm:gap-1 max-sm:p-1.5 ${tinted ? "border-border bg-surface" : "border-dashed border-border bg-surface-muted"}`}
      style={tint}
    >
      {layer}
      {tinted ? <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: state.token }} /> : null}
      {identity}
      <div className="mt-auto flex flex-col gap-2">
        {status}
        <QuantityControls sticker={sticker} userAlbumId={userAlbumId} displayed={displayed} serverQuantity={sticker.quantity} stretch onIntent={handleIntent} />
      </div>
    </li>
  );
}
