"use client";

import { useFormStatus } from "react-dom";

export function QuantityButton({ label, children, disabled = false }: { label: string; children: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      aria-label={label}
      className="min-h-11 min-w-11 rounded-control border border-border bg-surface text-content hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-muted"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "…" : children}
    </button>
  );
}
