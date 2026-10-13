"use client";

import { useState, type ReactNode } from "react";

export function StickerSection({ name, owned, total, defaultOpen = false, children }: { name: string; owned: number; total: number; defaultOpen?: boolean; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      className={`overflow-hidden rounded-card border border-border ${isOpen ? "bg-surface-muted" : "bg-surface"}`}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open={isOpen}
    >
      <summary
        aria-expanded={isOpen}
        className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline focus-visible:outline-2 [&::-webkit-details-marker]:hidden"
      >
        <span className="min-w-0 font-medium text-content">{name}</span>
        <span className="flex shrink-0 items-center gap-3 text-sm text-muted">
          <span>{owned} / {total}</span>
          <span className="sr-only">{isOpen ? "Expandida" : "Colapsada"}</span>
          <span aria-hidden="true">{isOpen ? "▴" : "▾"}</span>
        </span>
      </summary>
      <div className="border-t border-border">{children}</div>
    </details>
  );
}
