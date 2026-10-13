import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UI-05C.2 radius guard.
 *
 * Tailwind's `--radius-*` namespace is what generates the `rounded-*`
 * utilities, and it only emits utilities it finds in the scanned sources. Two
 * things therefore have to stay true in `globals.css`, and neither is visible
 * from a green build:
 *
 *   1. `@theme static` maps every `--radius-*` name to the generated
 *      `--album-radius-*` token. A bare `--radius-control: 0.75rem` here would
 *      be a second source of truth, and a self-referential
 *      `--radius-control: var(--radius-control)` would resolve to nothing.
 *   2. `@source inline(...)` pins the whole scale, so `rounded-pill` keeps
 *      existing even though no component consumes it yet.
 *
 * The compiled CSS is verified separately during the phase gates; this test
 * guards the source contract that produces it.
 */
const GLOBALS_PATH = resolve(process.cwd(), "src/app/globals.css");
const TOKENS_PATH = resolve(process.cwd(), "src/styles/tokens.css");

const RADIUS_NAMES = ["control", "card", "sticker", "pill"] as const;

describe("globals.css radius registration (UI-05C.2)", () => {
  const globals = readFileSync(GLOBALS_PATH, "utf8");

  it("maps every Tailwind radius name to its productive --album-radius-* token", () => {
    for (const name of RADIUS_NAMES) {
      expect(globals).toContain(`--radius-${name}: var(--album-radius-${name});`);
    }
  });

  it("never declares a self-referential radius alias", () => {
    for (const name of RADIUS_NAMES) {
      expect(globals).not.toContain(`--radius-${name}: var(--radius-${name})`);
    }
  });

  it("pins the whole radius scale so every utility is generated", () => {
    const pinned = globals.match(/@source inline\(([^)]*)\)/g) ?? [];
    const candidates = pinned.join(" ");
    for (const name of RADIUS_NAMES) {
      expect(candidates).toContain(`rounded-${name}`);
    }
  });

  it("keeps the productive radius values in the generated token sheet only", () => {
    const tokens = readFileSync(TOKENS_PATH, "utf8");
    for (const name of RADIUS_NAMES) {
      expect(tokens).toContain(`--album-radius-${name}:`);
    }
    // A bare `--radius-*` declaration here would collide with the `@theme`
    // mapping above and leave the utilities ungenerated.
    expect(tokens).not.toMatch(/^\s*--radius-(control|card|sticker|pill):/m);
  });
});
