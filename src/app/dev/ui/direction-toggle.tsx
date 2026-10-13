"use client";

import { useEffect, useState } from "react";

/**
 * UI-04A.2 — DirectionToggle.
 *
 * A Client Component exclusive to `/dev/ui`. It switches the visual direction
 * between the current reference and the experimental brand proposal by setting
 * `data-direction="current|proposal"` on `<main id="dev-ui">`.
 *
 * Isolation guarantees:
 *   - It never touches `data-theme`, `.dark` or the `app-album-theme` key, so
 *     the theme toggle keeps working independently.
 *   - It persists under its own key (`app-album-direction`).
 *   - Storage access is defensive: private mode / disabled storage falls back
 *     to `current` without throwing.
 *   - An absent or invalid stored value is treated as `current`.
 */

export const DIRECTION_STORAGE_KEY = "app-album-direction";

export type Direction = "current" | "proposal";

export function isDirection(value: unknown): value is Direction {
  return value === "current" || value === "proposal";
}

/** Stored preference wins; anything unknown falls back to `current`. */
export function resolveInitialDirection(stored: unknown): Direction {
  return isDirection(stored) ? stored : "current";
}

function applyDirection(direction: Direction) {
  const main = document.getElementById("dev-ui");
  if (main) main.setAttribute("data-direction", direction);
}

export function DirectionToggle() {
  const [direction, setDirection] = useState<Direction>("current");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(DIRECTION_STORAGE_KEY);
    } catch {
      stored = null;
    }
    const initial = resolveInitialDirection(stored);
    setDirection(initial);
    applyDirection(initial);
  }, []);

  function select(next: Direction) {
    setDirection(next);
    applyDirection(next);
    try {
      window.localStorage.setItem(DIRECTION_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the direction still applies.
    }
  }

  return (
    <div
      role="group"
      aria-label="Dirección visual"
      className="inline-flex overflow-hidden rounded-control border border-border bg-surface"
    >
      <button
        type="button"
        aria-pressed={direction === "current"}
        onClick={() => select("current")}
        className={[
          "min-h-[44px] px-3 py-1.5 text-sm transition-colors",
          direction === "current"
            ? "bg-primary text-primary-text"
            : "text-muted hover:bg-surface-muted",
        ].join(" ")}
      >
        Referencia actual
      </button>
      <button
        type="button"
        aria-pressed={direction === "proposal"}
        onClick={() => select("proposal")}
        className={[
          "min-h-[44px] px-3 py-1.5 text-sm transition-colors",
          direction === "proposal"
            ? "bg-primary text-primary-text"
            : "text-muted hover:bg-surface-muted",
        ].join(" ")}
      >
        Propuesta marca
      </button>
    </div>
  );
}
