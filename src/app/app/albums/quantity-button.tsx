"use client";

import { useFormStatus } from "react-dom";

/**
 * `stretch` fills the parent form so the mosaic can share the card width
 * between the two 44 px targets. The real hit area never shrinks below
 * `min-h-11 min-w-11`; only the surrounding layout changes.
 */
export function QuantityButton({ label, children, disabled = false, stretch = false }: { label: string; children: string; disabled?: boolean; stretch?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      aria-label={label}
      className={`min-h-11 min-w-11 rounded-control border border-border bg-surface text-content hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted${stretch ? " w-full" : ""}`}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "…" : children}
    </button>
  );
}
