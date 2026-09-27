import { describe, expect, it } from "vitest";
import {
  THEME_STORAGE_KEY,
  isTheme,
  nextTheme,
  resolveInitialTheme,
  themeInitScript,
} from "./theme";

describe("theme resolution", () => {
  it("prefers a stored valid preference over the system preference", () => {
    expect(resolveInitialTheme("dark", false)).toBe("dark");
    expect(resolveInitialTheme("light", true)).toBe("light");
  });

  it("falls back to prefers-color-scheme when nothing valid is stored", () => {
    expect(resolveInitialTheme(null, true)).toBe("dark");
    expect(resolveInitialTheme(null, false)).toBe("light");
    expect(resolveInitialTheme("sepia", true)).toBe("dark");
    expect(resolveInitialTheme(undefined, false)).toBe("light");
  });

  it("toggles between the two supported themes", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });

  it("validates theme values", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it("builds an inline script that reads storage and the media query", () => {
    const script = themeInitScript();
    expect(script).toContain(THEME_STORAGE_KEY);
    expect(script).toContain("prefers-color-scheme: dark");
    expect(script).toContain("classList.toggle('dark'");
    expect(script).toContain("try{");
  });
});
