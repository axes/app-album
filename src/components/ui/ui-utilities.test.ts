// @vitest-environment node

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

/**
 * Design v2 — utility class coverage guard.
 *
 * Every utility class a component ships in its `className` must compile to
 * a real CSS rule. A class that does not resolve in the compiled CSS is
 * either a typo or a token that is missing from the design system. Either
 * way, the component would render without the intended style and the bug
 * would be silent in the browser.
 *
 * The probe is built in `os.tmpdir()` (never inside `src/`) and the
 * directory is removed on every test, even when an assertion throws.
 */

const GLOBALS_PATH = resolve(process.cwd(), "src/app/globals.css");

let probeDir = "";
afterEach(() => {
  if (probeDir) {
    rmSync(probeDir, { recursive: true, force: true });
    probeDir = "";
  }
});

async function compile(classes: string[]): Promise<string> {
  const dir = mkdtempSync(resolve(tmpdir(), "ui-util-"));
  probeDir = dir;
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, "probe.css");
  const html =
    "<div " + classes.map((c) => `class="${c}"`).join(" ") + "></div>";
  writeFileSync(
    file,
    [
      `@import "${GLOBALS_PATH}";`,
      `@source inline(${JSON.stringify(html)});`,
    ].join("\n"),
  );
  try {
    const out = await postcss([tailwind()]).process(readFileSync(file, "utf8"), {
      from: file,
    });
    return out.css;
  } finally {
    rmSync(dir, { recursive: true, force: true });
    probeDir = "";
  }
}

function escapeCssSelector(className: string): string {
  return (
    "." +
    className
      .replace(/\\/g, "\\\\")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/,/g, "\\,")
      .replace(/\./g, "\\.")
      .replace(/:/g, "\\:")
  );
}

describe("Design v2 — every primitive utility class compiles to CSS", () => {
  it("compiles globals.css + the inline probe with @tailwindcss/postcss", async () => {
    const css = await compile(["bg-primary"]);
    expect(css.length).toBeGreaterThan(50_000);
  });

  // Button — base, sizes, variants, hover/active/disabled, transitions.
  const buttonClasses: Array<[string, string]> = [
    ["btn", "daisyUI button base"],
    ["type-button", "DESIGN v2 §6 typography"],
    ["type-button-compact", "DESIGN v2 §6 compact typography"],
    ["border-0", "daisyUI default override"],
    ["normal-case", "daisyUI default override"],
    ["shadow-none", "daisyUI default override"],
    ["rounded-control", "DESIGN v2 §7 radius"],
    ["min-h-11", "DESIGN v2 §16 44 px touch target"],
    ["h-11", "DESIGN v2 §7 md size"],
    ["h-9", "DESIGN v2 §7 sm size"],
    ["border-[1.5px]", "DESIGN v2 §7 1.5 px border"],
    ["border-transparent", "daisyUI default override"],
    ["gap-2", "DESIGN v2 §7 8 px gap"],
    ["duration-[var(--transition-fast)]", "DESIGN v2 §7 + §15 motion"],
    ["ease-[var(--ease-standard)]", "DESIGN v2 §7 + §15 motion"],
    [
      "transition-[color,background-color,border-color,opacity,transform]",
      "DESIGN v2 §7 + §15 motion",
    ],
    ["hover:[filter:brightness(1.1)]", "DESIGN v2 §7 hover"],
    ["active:scale-[.97]", "DESIGN v2 §7 active"],
    ["disabled:opacity-45", "DESIGN v2 §7 disabled"],
    ["disabled:cursor-not-allowed", "DESIGN v2 §7 disabled"],
    ["disabled:hover:[filter:none]", "DESIGN v2 §7 disabled"],
    ["disabled:active:scale-100", "DESIGN v2 §7 disabled"],
    ["cursor-wait", "DESIGN v2 §7 loading"],
    ["aspect-square", "DESIGN v2 §7 iconOnly"],
    ["w-11", "DESIGN v2 §7 iconOnly"],
    ["justify-center", "DESIGN v2 §7 iconOnly"],
    ["px-0", "DESIGN v2 §7 iconOnly"],
    ["px-4", "DESIGN v2 §7 md padding"],
    ["px-3", "DESIGN v2 §7 sm padding"],
    ["btn-primary", "DESIGN v2 §7 primary"],
    ["btn-accent", "DESIGN v2 §7 accent"],
    ["btn-error", "DESIGN v2 §7 danger"],
    ["btn-ghost", "DESIGN v2 §7 ghost"],
    ["btn-link", "DESIGN v2 §7 link"],
    ["bg-primary", "DESIGN v2 §7 primary"],
    ["bg-accent", "DESIGN v2 §7 accent"],
    ["bg-danger", "DESIGN v2 §7 danger"],
    ["bg-transparent", "DESIGN v2 §7 secondary"],
    ["border-input-border", "DESIGN v2 §7 secondary border"],
    ["text-content", "DESIGN v2 §7 secondary text"],
    ["text-primary", "DESIGN v2 §7 ghost / link"],
    ["text-on", "DESIGN v2 §7 filled foreground"],
    ["hover:bg-surface-muted", "DESIGN v2 §7 secondary hover"],
    ["hover:text-accent", "DESIGN v2 §7 link hover"],
    ["underline-offset-2", "DESIGN v2 §7 link"],
  ];

  it.each(buttonClasses)(
    "Button class %s (%s) compiles to a CSS rule",
    async (className) => {
      const css = await compile([className]);
      const cssForm = escapeCssSelector(className);
      expect(
        css.includes(cssForm),
        `${cssForm} must exist in the compiled CSS`,
      ).toBe(true);
    },
  );

  // QuantityButton — the centred icon utility. The 44 × 44 px hit target
  // and the 20 px glyph must share the same horizontal / vertical axis.
  // Each class on the button or its `<Icon>` is asserted to compile.
  const quantityClasses: Array<[string, string]> = [
    ["inline-flex", "QuantityButton: flex container"],
    ["items-center", "QuantityButton: vertical centering"],
    ["justify-center", "QuantityButton: horizontal centering"],
    ["block", "Icon: removes inline baseline gap"],
    ["shrink-0", "Icon: keeps the 20 px size in flex parents"],
    ["min-h-11", "QuantityButton: 44 px touch target"],
    ["min-w-11", "QuantityButton: 44 px touch target"],
    ["rounded-control", "QuantityButton: control radius"],
    ["border", "QuantityButton: outline border"],
    ["border-border", "QuantityButton: border colour"],
    ["bg-surface", "QuantityButton: idle background"],
    ["text-content", "QuantityButton: idle text colour"],
    ["hover:bg-surface-muted", "QuantityButton: hover background"],
    ["focus-visible:outline", "QuantityButton: focus ring"],
    ["focus-visible:outline-2", "QuantityButton: focus ring width"],
    ["disabled:cursor-not-allowed", "QuantityButton: disabled cursor"],
    ["disabled:bg-surface-muted", "QuantityButton: disabled background"],
    ["disabled:text-muted", "QuantityButton: disabled text colour"],
  ];

  it.each(quantityClasses)(
    "QuantityButton class %s (%s) compiles to a CSS rule",
    async (className) => {
      const css = await compile([className]);
      const cssForm = escapeCssSelector(className);
      expect(
        css.includes(cssForm),
        `${cssForm} must exist in the compiled CSS`,
      ).toBe(true);
    },
  );

  // SegmentedControl.
  const segmentedClasses: Array<[string, string]> = [
    ["inline-flex", "container"],
    ["items-center", "container"],
    ["gap-1", "container"],
    ["rounded-pill", "container + items"],
    ["border", "container"],
    ["border-border", "container"],
    ["bg-surface-muted", "container surface-soft alias"],
    ["p-1", "container 4 px padding"],
    ["min-h-11", "items 44 px touch target"],
    ["px-4", "items 16 px padding"],
    ["text-sm", "items 14 px text"],
    ["font-semibold", "items 600 weight"],
    ["bg-transparent", "unselected item"],
    ["text-content", "unselected item"],
    ["hover:bg-surface", "unselected item hover"],
    ["hover:[filter:brightness(1.1)]", "selected item hover"],
    ["focus-visible:outline", "DESIGN v2 §15 focus"],
    ["focus-visible:outline-2", "DESIGN v2 §15 focus"],
    ["focus-visible:outline-offset-2", "DESIGN v2 §15 focus"],
  ];

  it.each(segmentedClasses)(
    "SegmentedControl class %s (%s) compiles to a CSS rule",
    async (className) => {
      const css = await compile([className]);
      const cssForm = escapeCssSelector(className);
      expect(css.includes(cssForm), `${cssForm} must exist`).toBe(true);
    },
  );

  // Badge.
  const badgeClasses: Array<[string, string]> = [
    ["inline-flex", "pill container"],
    ["w-fit", "pill shrink-to-fit"],
    ["items-center", "pill container"],
    ["gap-1", "pill 4 px gap"],
    ["rounded-pill", "DESIGN v2 §9 pill radius"],
    ["border", "DESIGN v2 §9 outline border"],
    ["px-2.5", "DESIGN v2 §9 10 px padding"],
    ["py-0.5", "DESIGN v2 §9 2 px padding"],
    ["text-xs", "DESIGN v2 §9 12 px text"],
    ["font-semibold", "DESIGN v2 §9 600 weight"],
    ["bg-surface-muted", "DESIGN v2 §9 neutral / secondary background"],
    ["border-border", "DESIGN v2 §9 neutral / secondary border"],
    ["text-content", "DESIGN v2 §9 neutral text"],
    ["text-muted", "DESIGN v2 §9 secondary text"],
    ["bg-info", "DESIGN v2 §9 info (== primary)"],
    ["border-info", "DESIGN v2 §9 info border"],
    ["bg-success", "DESIGN v2 §9 success"],
    ["border-success", "DESIGN v2 §9 success border"],
    ["bg-warning", "DESIGN v2 §9 warning"],
    ["border-warning", "DESIGN v2 §9 warning border"],
  ];

  it.each(badgeClasses)(
    "Badge class %s (%s) compiles to a CSS rule",
    async (className) => {
      const css = await compile([className]);
      const cssForm = escapeCssSelector(className);
      expect(css.includes(cssForm), `${cssForm} must exist`).toBe(true);
    },
  );

  it("Badge neutral: bg-surface-muted resolves to var(--color-surface-muted)", async () => {
    const css = await compile(["bg-surface-muted"]);
    const m = css.match(
      /\.bg-surface-muted\s*\{[^}]*background-color:\s*var\(--color-surface-muted\)/,
    );
    expect(m, "bg-surface-muted must declare background-color: var(--color-surface-muted)").toBeTruthy();
    expect(
      /--color-surface-muted:\s*var\(--album-surface-soft\)/.test(css),
      "--color-surface-muted must alias --album-surface-soft",
    ).toBe(true);
    expect(
      /--album-surface-soft:\s*#[0-9a-fA-F]{3,8}/.test(css),
      "--album-surface-soft must hold a concrete colour",
    ).toBe(true);
  });

  it("Badge secondary: same background + border, muted text", async () => {
    const css = await compile([
      "bg-surface-muted",
      "border-border",
      "text-muted",
    ]);
    expect(css).toMatch(/\.bg-surface-muted\s*\{[^}]*var\(--color-surface-muted\)/);
    expect(css).toMatch(/\.border-border\s*\{/);
    expect(css).toMatch(/\.text-muted\s*\{[^}]*color:\s*var\(--color-muted\)/);
    expect(
      /--color-muted:\s*var\(--album-text-muted\)/.test(css),
      "--color-muted must alias --album-text-muted",
    ).toBe(true);
  });

  it("Token-scope guard — every bg-/text-/border-/ring-/shadow-/from-/to-/fill-/stroke- utility in src/ (excluding /dev/ui and tests) compiles to CSS", async () => {
    // Permanently mounted `globals.css` + `os.tmpdir()` probe. The
    // expectation is: every token-named utility class that any
    // productive file references compiles to a real CSS rule. A
    // class like `bg-surface-soft` (no `--color-surface-soft` alias)
    // would not produce a rule, and the assertion below would point
    // the agent at the offending class name. The scan is narrowed
    // to the productive tree: tests are ignored, the /dev/ui
    // laboratory is ignored, and a small allowlist of classes that
    // originate in daisyUI (`btn-*`, `type-*`, `animate-*`,
    // `sticker-burst*`, `mobile-nav-*`, etc.) is excluded.
    const srcDir = resolve(process.cwd(), "src");
    const skip = (p: string) =>
      p.includes("/dev/ui") || p.endsWith(".test.tsx") || p.endsWith(".test.ts");
    const tokenRe =
      /(^|\s)(bg-|text-|border-|ring-|shadow-|from-|to-|fill-|stroke-)([a-z0-9_/\-\[\]\(\)\.\,\:\#\+\*\&\$]+)/g;
    const allowlist = new Set<string>([
      // DESIGN v2 fixed vocabulary that ships in `globals.css` and
      // is not derived from a `--color-*` token.
      "type-button",
      "type-button-compact",
      "type-display",
      "type-small",
      "type-caption",
      "type-label",
      "type-numeric",
      "type-sticker-number",
      "type-sticker-number-compact",
      "sticker-burst-particle",
      "sticker-ghost-in",
      "sticker-ghost-out",
      "sticker-burst",
      "sticker-ghost",
      "app-shell-header-inner",
      "app-shell-link",
      "app-shell-dock",
      "mobile-nav",
      "mobile-nav-grid",
      "mobile-nav-slot",
      "mobile-nav-link",
      "mobile-nav-icon",
      "mobile-nav-label",
      "logo-placeholder",
    ]);
    function walk(dir: string, acc: string[]): string[] {
      for (const entry of readdirSync(dir)) {
        const full = resolve(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          if (
            entry === "node_modules" ||
            entry === ".next" ||
            entry === ".nanobot" ||
            entry === "artifacts"
          )
            continue;
          walk(full, acc);
        } else if (/\.(tsx|ts|jsx|js)$/.test(entry) && !skip(full)) {
          acc.push(full);
        }
      }
      return acc;
    }
    const files = walk(srcDir, []);
    const seen = new Set<string>();
    for (const f of files) {
      const text = readFileSync(f, "utf8");
      for (const m of text.matchAll(tokenRe)) {
        const cls = (m[2] + m[3]).split(/\s/)[0];
        if (allowlist.has(cls)) continue;
        if (cls.startsWith("btn-")) continue;
        if (["transparent", "current", "inherit", "none"].includes(cls)) continue;
        seen.add(cls);
      }
    }
    const classes = [...seen].sort();
    const css = await compile(classes);
    const missing: string[] = [];
    for (const className of classes) {
      const cssForm = escapeCssSelector(className);
      if (!css.includes(cssForm)) missing.push(className);
    }
    if (missing.length > 0) {
      const lines = missing.map((c) => {
        const offenders: string[] = [];
        for (const f of files) {
          const t = readFileSync(f, "utf8");
          if (t.includes(c)) offenders.push(f.replace(process.cwd() + "/", ""));
        }
        return `${c} (in: ${offenders.slice(0, 5).join(", ")}${offenders.length > 5 ? `, +${offenders.length - 5} more` : ""})`;
      });
      throw new Error(
        "Token-scope guard found utility classes without a compiled CSS rule:\n  " +
          lines.join("\n  "),
      );
    }
  });
});
