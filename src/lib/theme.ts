export const THEME_STORAGE_KEY = "app-album-theme";

export type Theme = "light" | "dark";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Stored preference wins; otherwise fall back to the OS/browser preference.
 * Unknown or corrupted values are treated as "no preference".
 */
export function resolveInitialTheme(stored: unknown, prefersDark: boolean): Theme {
  if (isTheme(stored)) return stored;
  return prefersDark ? "dark" : "light";
}

export function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

/**
 * Inline script injected in <head> so the correct theme class is applied before
 * the first paint. Kept dependency-free and defensive: any failure (private
 * mode, disabled storage) silently falls back to the OS preference.
 */
export function themeInitScript(): string {
  return [
    "(function(){try{",
    `var k=${JSON.stringify(THEME_STORAGE_KEY)};`,
    "var s=window.localStorage.getItem(k);",
    "var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');",
    "var r=document.documentElement;",
    "r.classList.toggle('dark',t==='dark');",
    "r.dataset.theme=t;",
    "}catch(e){}})();",
  ].join("");
}
