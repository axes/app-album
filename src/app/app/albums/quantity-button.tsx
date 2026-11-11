"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icons";

/**
 * `stretch` fills the parent form so the mosaic can share the card width
 * between the two 44 px targets. The real hit area never shrinks below
 * `min-h-11 min-w-11`; only the surrounding layout changes.
 *
 * The pending state renders the DESIGN v2 §6 `loading` glyph instead of a
 * text ellipsis. The 800 ms spin (`--motion-spin`) is intentionally not
 * applied here: the animated loading primitive belongs to the base-components
 * step, and this phase only swaps the glyph.
 */
const COMPACT_CLASSES = {
  cover:
    "max-sm:absolute max-sm:inset-0 max-sm:z-0 max-sm:min-h-0 max-sm:items-end max-sm:justify-end max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-1.5 max-sm:text-muted max-sm:-outline-offset-2 max-sm:hover:bg-transparent max-sm:disabled:bg-transparent",
  raised: "max-sm:relative max-sm:z-10 max-sm:w-11",
} as const;

export function QuantityButton({
  label,
  children,
  disabled = false,
  stretch = false,
  compact,
  onIntent,
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  stretch?: boolean;
  /**
   * Mosaic behaviour below `sm`, where four tiles share a phone row and two
   * 44 px targets no longer fit side by side:
   *  - `cover`: the button becomes a transparent layer over the whole tile, so
   *    tapping anywhere on the sticker adds a copy; its glyph sits in the
   *    bottom-right corner as the affordance.
   *  - `raised`: the button keeps its 44 px box and stays above that layer.
   * From `sm` up both render exactly like a regular stretched button.
   */
  compact?: "cover" | "raised";
  onIntent?: () => void;
}) {
  const { pending } = useFormStatus();
  const unavailable = disabled || pending;

  return (
    <button
      aria-label={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-surface text-content hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted${stretch ? " w-full" : ""} ${compact ? COMPACT_CLASSES[compact] : ""}`}
      disabled={unavailable}
      onClick={() => {
        if (!unavailable) onIntent?.();
      }}
      type="submit"
    >
      {pending ? <Icon className="block shrink-0" name="loading" size="md" /> : children}
    </button>
  );
}
