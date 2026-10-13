"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * UI-05C.3 — local `prefers-reduced-motion` hook.
 *
 * Deliberately local instead of `useReducedMotion()` from Motion: the card
 * needs to decide *before rendering* whether to mount the decorative layer
 * (particles, ghost), not merely shorten its duration. A local hook keeps
 * that decision explicit and testable with a plain `matchMedia` stub.
 *
 * SSR-safe: the initial state is `false`, so the first client render matches
 * the server render and there is no hydration mismatch. The effect only runs
 * in the browser and always removes its listener.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const query = window.matchMedia(QUERY);
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
