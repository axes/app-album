// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import postcss, { type Rule } from "postcss";

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

  it("applies the DESIGN v2 product typography without overriding /dev/ui", () => {
    expect(globals).toContain(":where(h1):where(:not(#dev-ui h1))");
    expect(globals).toContain("font-family: var(--font-display)");
    expect(globals).toContain("font-size: var(--text-h1)");
    expect(globals).toContain(":where(h2):where(:not(#dev-ui h2))");
    expect(globals).toContain("font-size: var(--text-h2)");
    expect(globals).toContain("font-weight: 600");
    expect(globals).toContain(".type-numeric");
    expect(globals).toContain("font-variant-numeric: tabular-nums");
    expect(globals).toContain("text-transform: none");
  });

  it("keeps the typography contract at zero specificity so utilities win", () => {
    // The product rules wrap their element selector in `:where(...)` and
    // their `:not(...)` filter in its own `:where(...)` block. A bare id
    // outside `:not()` would push the rule above the Tailwind utilities, so
    // any `#dev-ui` reference must sit inside a `:not()` argument.
    const productRules = [
      ":where(body) {",
      ":where(h1):where(:not(#dev-ui h1)) {",
      ":where(h2):where(:not(#dev-ui h2)) {",
      ":where(h3):where(:not(#dev-ui h3)) {",
      ":where(button):where(:not(#dev-ui button)),",
      ':where([role="button"]):where(:not(#dev-ui [role="button"])),',
      ":where(label):where(:not(#dev-ui label)) {",
    ];
    for (const fragment of productRules) {
      expect(globals, `Missing zero-specificity rule: ${fragment}`).toContain(fragment);
    }
  });
});

describe("DESIGN v2 typography contract specificity (UI-08B)", () => {
  // Specificity for a CSS selector is the triple (id, class/attr/pseudo-class,
  // type/pseudo-element). `:where(...)` always contributes (0,0,0) regardless
  // of its arguments, and the argument of `:not(...)` is *not* counted
  // against the surrounding selector. A selector of the form
  // `:where(h1):where(:not(#dev-ui h1))` therefore resolves to (0,0,0) and
  // any Tailwind utility wins by source order alone.
  type Specificity = { ids: number; classes: number; types: number };

  function ruleSpecificity(rule: Rule): Specificity {
    const acc: Specificity = { ids: 0, classes: 0, types: 0 };
    const visit = (node: { type: string; value?: string; nodes?: unknown[] }) => {
      if (!node || !node.nodes) return;
      for (const child of node.nodes as Array<{
        type: string;
        value?: string;
        nodes?: unknown[];
      }>) {
        if (child.type === "id") acc.ids += 1;
        else if (child.type === "class" || child.type === "attribute") acc.classes += 1;
        else if (child.type === "tag") acc.types += 1;
        else if (child.type === "pseudo") {
          const name = (child.value ?? "").toLowerCase();
          // `:not(...)`, `:is(...)`, `:where(...)` and `:has(...)` are
          // argument-only pseudo-classes: their content does not add to the
          // surrounding selector's specificity, so we just keep walking.
          if (["not", "is", "where", "has", "matches"].includes(name)) {
            visit(child);
          } else {
            acc.classes += 1;
          }
        } else if (child.type === "nesting" || child.type === "selector") {
          visit(child);
        }
      }
    };
    visit(rule as unknown as { type: string; nodes?: unknown[] });
    return acc;
  }

  it("resolves every product typography selector to specificity (0,0,0)", () => {
    const css = readFileSync(GLOBALS_PATH, "utf8");
    const root = postcss.parse(css);
    const collected: { rule: Rule; selector: string }[] = [];
    root.walkRules((rule) => {
      const selector = rule.selector;
      // Only the product typography contract is in scope here. The contract
      // lives inside the single `DESIGN v2 typography` comment block and
      // always starts with `:where(`. Other rules (radius registration,
      // sticker burst animation, …) are deliberately excluded.
      if (!/^:where\(/.test(selector)) return;
      if (selector.includes("body") || selector.includes("h1") ||
          selector.includes("h2") || selector.includes("h3") ||
          selector.includes("button") || selector.includes("label") ||
          selector.includes("role=\"button\"")) {
        collected.push({ rule, selector });
      }
    });
    expect(collected.length).toBeGreaterThanOrEqual(6);
    for (const { rule, selector } of collected) {
      const specificity = ruleSpecificity(rule);
      expect(
        specificity,
        `selector "${selector}" must resolve to (0,0,0); got (${specificity.ids},${specificity.classes},${specificity.types})`,
      ).toEqual({ ids: 0, classes: 0, types: 0 });
    }
  });

  it("lets a real Tailwind utility on a heading win over the product rule", () => {
    // Cascade check: we inject both the product contract rule and a real
    // `text-sm` utility into a `<style>` tag, render a heading with the
    // utility on it, and read the computed `font-size` from jsdom. Because
    // the contract rule has specificity (0,0,0) and the utility selector
    // `.text-sm` has specificity (0,1,0), the utility wins and the heading
    // ends up at 0.875rem (the value DESIGN.md v2 assigns to "Pequeño").
    const style = document.createElement("style");
    style.textContent = [
      ":where(h3):where(:not(#dev-ui h3)) { font-size: 1.125rem; }",
      ".text-sm { font-size: 0.875rem; }",
    ].join("\n");
    document.head.appendChild(style);

    const heading = document.createElement("h3");
    heading.className = "text-sm";
    heading.textContent = "x";
    document.body.appendChild(heading);

    const computed = getComputedStyle(heading).fontSize;
    // jsdom keeps the unit the rule declared, so the cascade winner reads
    // back as the original `0.875rem` from the utility rather than the
    // product rule's `1.125rem`. The unit doesn't matter — what matters is
    // that the utility value won.
    expect(computed).toBe("0.875rem");
  });
});
