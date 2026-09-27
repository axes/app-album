"use client";

import { useFormStatus } from "react-dom";

export function QuantityButton({ label, children, disabled = false }: { label: string; children: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      aria-label={label}
      className="h-9 min-w-9 rounded border border-border bg-surface text-content hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:text-muted"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "…" : children}
    </button>
  );
}
