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
export function QuantityButton({
  label,
  children,
  disabled = false,
  stretch = false,
  onIntent,
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  stretch?: boolean;
  onIntent?: () => void;
}) {
  const { pending } = useFormStatus();
  const unavailable = disabled || pending;

  return (
    <button
      aria-label={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-surface text-content hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted${stretch ? " w-full" : ""}`}
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
