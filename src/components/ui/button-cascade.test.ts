// @vitest-environment node

import { createElement } from "react";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { Button } from "./button";
import { wcagRatio } from "../../../scripts/contrast";
import { productiveCanonicalColorTokens } from "../../../scripts/ui-tokens";

/**
 * DESIGN v2 §7 — daisyUI cascade guard for Button.
 *
 * The Button primitive has to override daisyUI's `.btn` measurements
 * (height, padding, border width, gap, transition duration) without
 * touching daisyUI's source. The mechanism is:
 *
 *   1. daisyUI's `.btn` lives inside `@layer daisyui.l1.l2.l3`, which is
 *      nested *inside* `@layer utilities`.
 *   2. Tailwind 4 emits utility classes that we ship on Button
 *      (`h-11`, `h-9`, `border-[1.5px]`, `gap-2`, `duration-[…]`,
 *      `aspect-square`, `rounded-pill`, `rounded-control`,
 *      `active:scale-[.97]`, `disabled:opacity-45`,
 *      `disabled:cursor-not-allowed`) directly inside `@layer utilities`,
 *      *outside* any daisyUI sub-layer.
 *   3. By cascade rule, a declaration inside a parent layer wins over a
 *      declaration inside a nested sub-layer, regardless of selector
 *      specificity or source order. So even if `.btn { height: 2.5rem }`
 *      comes after `.h-11 { height: 2.75rem }` in the file, `.h-11` wins.
 *
 * This test compiles a CSS that `@source inline()`s the Button utility
 * classes via a `@source inline(...)` block, runs `@tailwindcss/postcss`
 * and asserts both the layer placement of every override utility and the
 * layer placement of daisyUI's `.btn`. The probe is built in `os.tmpdir()`
 * — never inside `src/` — and is always removed, even when an assertion
 * throws.
 */

interface RuleLocation {
  outer: string;
  inner: string;
  selector: string;
  start: number;
  declarations: Array<{ prop: string; value: string }>;
}

function classify(root: postcss.Root): RuleLocation[] {
  const rules: RuleLocation[] = [];

  const collect = (
    container: postcss.Container,
    outer: string,
    inner: string,
  ): void => {
    container.each((node) => {
      if (node.type === "atrule") {
        const at = node as postcss.AtRule;
        if (at.name === "layer") {
          const params = (at.params ?? "").trim();
          // Block form only. `@layer foo, bar;` (no block) is a declaration.
          if (at.nodes && params && !params.includes(",")) {
            const nextOuter = outer === "root" ? params : outer;
            const nextInner =
              outer === "utilities" && inner === "" && params.startsWith("daisyui")
                ? params
                : inner;
            collect(at, nextOuter, nextInner);
          }
          return;
        }
        if ((at.name === "media" || at.name === "supports") && at.nodes) {
          collect(at, outer, inner);
        }
        return;
      }
      if (node.type === "rule") {
        const rule = node as postcss.Rule;
        const declarations: Array<{ prop: string; value: string }> = [];
        if (rule.nodes) {
          (rule.nodes as postcss.Declaration[]).forEach((d) => {
            declarations.push({ prop: d.prop, value: d.value });
          });
        }
        rules.push({
          outer,
          inner,
          selector: rule.selector,
          start: rule.source?.start?.offset ?? 0,
          declarations,
        });
      }
    });
  };

  collect(root, "root", "");
  return rules;
}

const BUTTON_PROBE_HTML =
  '<button class="btn h-11 h-9 border-[1.5px] gap-2 ' +
  'duration-[var(--transition-fast)] aspect-square ' +
  'rounded-pill rounded-control px-4 px-3 ' +
  'hover:[filter:brightness(1.1)] active:scale-[.97] ' +
  'disabled:opacity-45 disabled:cursor-not-allowed"></button>';

// Build a self-contained CSS file inside `os.tmpdir()`. It imports the
// project's `globals.css` so daisyUI's real layer structure is exercised,
// and uses `@source inline(...)` to force the Tailwind scanner to emit the
// exact utilities Button depends on — without ever creating files inside
// `src/`.
function buildProbeSource(): { dir: string; file: string } {
  const dir = resolve(
    tmpdir(),
    `app-album-cascade-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, "probe.css");
  const globalsAbs = resolve(process.cwd(), "src/app/globals.css");
  writeFileSync(
    file,
    [
      `@import "${globalsAbs}";`,
      // The probe is only ever read by PostCSS; do not include any source
      // files on disk. The scanner picks it up directly.
      `@source inline("${BUTTON_PROBE_HTML}");`,
    ].join("\n"),
  );
  return { dir, file };
}

let probeDir = "";

afterEach(() => {
  // Defence in depth: even if an assertion throws between the temp
  // directory being created and `rmSync` running, the `afterEach` will
  // sweep the directory. The probe is **always** in `os.tmpdir()` — never
  // inside the repo — so a stray file would never show up in `git status`.
  if (probeDir) {
    rmSync(probeDir, { recursive: true, force: true });
    probeDir = "";
  }
});

async function compileCss(): Promise<{ css: string; rules: RuleLocation[] }> {
  const { dir, file } = buildProbeSource();
  probeDir = dir;
  const source = readFileSync(file, "utf8");
  try {
    const result = await postcss([tailwind()]).process(source, { from: file });
    return { css: result.css, rules: classify(postcss.parse(result.css)) };
  } finally {
    // `afterEach` will also clean up; removing here is the safe path when
    // the test is intercepted or the runner is killed.
    rmSync(dir, { recursive: true, force: true });
    probeDir = "";
  }
}

const findRule = (
  rules: RuleLocation[],
  selector: string,
): RuleLocation | undefined =>
  rules.find((r) => r.selector.trim() === selector);

describe("Button — daisyUI cascade guard (DESIGN v2 §7)", () => {
  let rules: RuleLocation[] = [];
  let css = "";

  it("compiles globals.css + @source inline probe with @tailwindcss/postcss", async () => {
    const out = await compileCss();
    rules = out.rules;
    css = out.css;
    expect(css.length).toBeGreaterThan(50_000);
    expect(rules.length).toBeGreaterThan(100);
  });

  it("places daisyUI's .btn inside a nested daisyui sub-layer of @layer utilities", () => {
    // daisyUI splits `.btn` across several sibling rules inside the same
    // daisyui.l1.l2.l3 sub-layer. We pick the rule that owns the visual
    // `height` (set via `height: var(--size)`) and assert the inner layer.
    const btnRule = rules.find(
      (r) =>
        r.outer === "utilities" &&
        r.inner.startsWith("daisyui") &&
        r.declarations.some((d) => d.prop === "height"),
    );
    expect(
      btnRule,
      ".btn (the rule that owns `height`) must exist in the compiled CSS",
    ).toBeTruthy();
    expect(
      btnRule!.inner,
      `daisyUI's .btn must be inside a daisyui.* sub-layer; was "${btnRule!.inner}"`,
    ).toMatch(/^daisyui/);
  });

  const expectedDirectUtilities: Array<[string, string]> = [
    [".h-11", "height"],
    [".h-9", "height"],
    [".border-\\[1\\.5px\\]", "border-width"],
    [".gap-2", "gap"],
    [".aspect-square", "aspect-ratio"],
    [".rounded-pill", "border-radius"],
    [".rounded-control", "border-radius"],
    [".duration-\\[var\\(--transition-fast\\)\\]", "transition-duration"],
    [".active\\:scale-\\[\\.97\\]:active", "scale"],
    [".disabled\\:opacity-45:disabled", "opacity"],
    [".disabled\\:cursor-not-allowed:disabled", "cursor"],
  ];

  it.each(expectedDirectUtilities)(
    "emits %s directly in @layer utilities, outside daisyUI",
    (selector, declaredProp) => {
      const rule = findRule(rules, selector);
      expect(rule, `${selector} must exist in the compiled CSS`).toBeTruthy();
      expect(
        rule!.inner,
        `${selector} must be in the parent @layer utilities (inner "${rule!.inner}").`,
      ).toBe("");
      expect(
        rule!.outer,
        `${selector} must be in @layer utilities (outer "${rule!.outer}").`,
      ).toBe("utilities");
      expect(
        rule!.declarations.some((d) => d.prop === declaredProp),
        `${selector} must declare \`${declaredProp}\` so the override is in the cascade.`,
      ).toBe(true);
    },
  );

  it("places .h-11 AFTER daisyUI's .btn in the source (defence in depth)", () => {
    const btnRule = rules.find(
      (r) =>
        r.outer === "utilities" &&
        r.inner.startsWith("daisyui") &&
        r.declarations.some((d) => d.prop === "height"),
    );
    const h11 = findRule(rules, ".h-11");
    expect(btnRule && h11).toBeTruthy();
    expect(
      h11!.start,
      "if the layer nesting were ever broken, .h-11 still has to come after .btn in the file",
    ).toBeGreaterThan(btnRule!.start);
  });

  it("emits .h-11 and .h-9 with the DESIGN §7 / §16 pixel values", () => {
    const h11 = findRule(rules, ".h-11");
    const h9 = findRule(rules, ".h-9");
    const h11Height = h11?.declarations.find((d) => d.prop === "height")?.value;
    const h9Height = h9?.declarations.find((d) => d.prop === "height")?.value;
    expect(h11Height).toMatch(/calc\(var\(--spacing\)\s*\*\s*11\)/);
    expect(h9Height).toMatch(/calc\(var\(--spacing\)\s*\*\s*9\)/);
  });
});

/**
 * Regression: the secondary variant used to carry `border-transparent` in the
 * shared base string *and* `border-input-border` in the variant string. Both
 * are `border-color` utilities in `@layer utilities`, so the winner is decided
 * by Tailwind's emission order — which is alphabetical, not the order the
 * classes appear in the attribute. `border-transparent` sorts after
 * `border-input-border`, so the secondary button rendered with no visible
 * border at all.
 *
 * These tests read the real class list off the rendered component (so they
 * cannot drift from `button.tsx`) and resolve the cascade the way the browser
 * does: a declaration in the parent `@layer utilities` beats one inside
 * daisyUI's nested sub-layer, and within the same layer the later source
 * position wins.
 */
describe("Button — effective border colour (regresión)", () => {
  const classNamesOf = (html: string): string[] => {
    const match = html.match(/class="([^"]*)"/);
    return match ? match[1].split(/\s+/).filter(Boolean) : [];
  };

  const compileWith = async (classNames: string[]) => {
    const dir = resolve(tmpdir(), `app-album-border-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    const file = resolve(dir, "probe.css");
    const globalsAbs = resolve(process.cwd(), "src/app/globals.css");
    writeFileSync(
      file,
      [
        `@import "${globalsAbs}";`,
        `@source inline("<button class=\\"${classNames.join(" ")}\\"></button>");`,
      ].join("\n"),
    );
    try {
      const result = await postcss([tailwind()]).process(readFileSync(file, "utf8"), { from: file });
      return classify(postcss.parse(result.css));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  /** Resolves the winning `border-color` for an element carrying `classNames`. */
  const effectiveBorderColor = (
    compiled: RuleLocation[],
    classNames: string[],
  ): { value: string; selector: string; inner: string } | null => {
    const candidates = compiled.filter((rule) => {
      const selector = rule.selector.trim();
      const single = selector.match(/^\.((?:\\.|[^\s.])+)$/);
      if (!single) return false;
      const name = single[1].replace(/\\/g, "");
      return (
        classNames.includes(name) &&
        rule.declarations.some((d) => d.prop === "border-color")
      );
    });

    // Parent layer (inner === "") beats a nested daisyUI sub-layer; within the
    // same layer, the later source position wins. Higher rank = wins.
    const rank = (rule: RuleLocation) => (rule.inner ? 1 : 2);
    candidates.sort((a, b) => rank(a) - rank(b) || a.start - b.start);

    const winner = candidates[candidates.length - 1];
    if (!winner) return null;
    return {
      value: winner.declarations.find((d) => d.prop === "border-color")!.value,
      selector: winner.selector,
      inner: winner.inner,
    };
  };

  it("resolves the secondary button border to --album-input-border", async () => {
    const classNames = classNamesOf(
      renderToStaticMarkup(
        createElement(Button, { variant: "secondary", size: "sm" }, "Editar"),
      ),
    );
    expect(classNames).toContain("border-input-border");
    expect(classNames).not.toContain("border-transparent");

    const compiled = await compileWith(classNames);
    const winner = effectiveBorderColor(compiled, classNames);

    expect(winner, "the secondary button must declare a border colour").toBeTruthy();
    expect(winner!.value).toBe("var(--color-input-border)");
    expect(winner!.selector.trim()).toBe(".border-input-border");
    expect(winner!.inner, "the winning utility must live in the parent @layer utilities").toBe("");
  });

  it("keeps daisyUI's .btn border-color in a nested sub-layer so it cannot win", async () => {
    const classNames = classNamesOf(
      renderToStaticMarkup(
        createElement(Button, { variant: "secondary", size: "sm" }, "Editar"),
      ),
    );
    const compiled = await compileWith(classNames);

    const btnBorder = compiled.find(
      (rule) =>
        rule.selector.trim() === ".btn" &&
        rule.declarations.some((d) => d.prop === "border-color"),
    );
    expect(btnBorder, ".btn must declare border-color").toBeTruthy();
    expect(btnBorder!.inner).toMatch(/^daisyui/);
    expect(btnBorder!.declarations.find((d) => d.prop === "border-color")!.value)
      .toBe("var(--btn-border)");
  });

  it("keeps the filled variants borderless (border-transparent still wins there)", async () => {
    for (const variant of ["primary", "accent", "danger"] as const) {
      const classNames = classNamesOf(
        renderToStaticMarkup(createElement(Button, { variant }, "Guardar")),
      );
      expect(classNames).toContain("border-transparent");
      expect(classNames).not.toContain("border-input-border");

      const compiled = await compileWith(classNames);
      const winner = effectiveBorderColor(compiled, classNames);
      expect(winner!.value, `${variant} must stay borderless`).toBe("transparent");
    }
  });

  it("keeps the secondary border visible against the surface (WCAG 1.4.11, ≥ 3:1)", () => {
    for (const theme of ["light", "dark"] as const) {
      const ratio = wcagRatio(
        productiveCanonicalColorTokens.inputBorder[theme],
        productiveCanonicalColorTokens.surface[theme],
      );
      expect(
        ratio,
        `inputBorder/surface in ${theme} must reach 3:1 for a non-text UI boundary`,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
