"use client";

import { useEffect, useState } from "react";
import {
  THEME_STORAGE_KEY,
  isTheme,
  nextTheme,
  resolveInitialTheme,
  type Theme,
} from "@/lib/theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = resolveInitialTheme(stored, prefersDark);
    setTheme(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  function toggle() {
    const updated = nextTheme(theme);
    setTheme(updated);
    applyTheme(updated);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, updated);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies.
    }
  }

  const label = theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={theme === "dark"}
      title={label}
      className="rounded border border-border bg-surface px-3 py-1 text-sm text-content hover:bg-surface-muted"
    >
      <span aria-hidden="true">{ready && theme === "dark" ? "☀️" : "🌙"}</span>
      <span className="ml-2">{theme === "dark" ? "Claro" : "Oscuro"}</span>
    </button>
  );
}

export { isTheme };
