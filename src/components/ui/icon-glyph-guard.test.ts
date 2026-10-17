import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * DESIGN v2 §6 / §11 — glyph guard.
 *
 * The product must never use a text character as an icon. Every icon comes
 * from `src/components/ui/icons.tsx` (Lucide). This test fails if any of the
 * characters that used to stand in for icons reappears anywhere in the
 * productive sources.
 *
 * Detection is AST-based, not regex-based, and deliberately broader than
 * "icon position": every JSX text node and every string literal is inspected,
 * so a glyph is caught in the middle of a button label, a link, a list item,
 * an `aria-label` or a plain string — not only when it opens the text.
 *
 * Two things are never inspected:
 *   - comments, so prose that documents the retired glyphs is safe;
 *   - regular-expression literals, so patterns such as
 *     `/[.*+?^${}()|[\]\\]/g` do not trip the guard.
 *
 * Scope:
 *   - `/dev/ui` is the isolated visual laboratory and is explicitly excluded.
 *   - `*.test.*` files are excluded (they legitimately assert on copy).
 */
const SRC = resolve(process.cwd(), "src");

/**
 * The exact set of characters the guard rejects. Grouped by the role they
 * used to play in the product; every entry is a single code point (or a
 * code-point + variation-selector pair for the emoji forms).
 */
const ICON_GLYPHS = [
  // Arithmetic / control glyphs used as +/− buttons.
  "−",
  "+",
  "＋",
  "➖",
  "➕",
  // Box drawing and geometric shapes used as view toggles and bullets.
  "▦",
  "▣",
  "▤",
  "▥",
  "▧",
  "▨",
  "▩",
  "☷",
  "☰",
  "▴",
  "▾",
  "▲",
  "▼",
  "◀",
  "▶",
  "◁",
  "▷",
  "◼",
  "◻",
  "▪",
  "▫",
  "◦",
  "◉",
  "◎",
  "◈",
  "❖",
  "●",
  "○",
  // Arrows used as move / navigation affordances.
  "↑",
  "↓",
  "←",
  "→",
  "⇄",
  "⇅",
  "⟳",
  "⟲",
  // Dingbats and stars used as status markers.
  "★",
  "☆",
  "✦",
  "✧",
  "✚",
  "✕",
  "✖",
  "✓",
  "✔",
  "✱",
  "✳",
  "✴",
  "✵",
  "✶",
  "✷",
  "✸",
  "✹",
  "✺",
  "✻",
  "✼",
  "✽",
  "✾",
  "✿",
  "❀",
  "❁",
  "❂",
  "❃",
  "❄",
  "❅",
  "❆",
  "❇",
  "❈",
  "❉",
  "❊",
  "❋",
  "❍",
  "❏",
  "❐",
  "❑",
  "❒",
  "❘",
  "❙",
  "❚",
  "➔",
  "➡",
  "➤",
  "➥",
  "➦",
  "➧",
  "➨",
  "➩",
  "➪",
  "➫",
  "➬",
  "➭",
  "➮",
  "➯",
  "➰",
  "➱",
  "➲",
  "➳",
  "➴",
  "➵",
  "➶",
  "➷",
  "➸",
  "➹",
  "➺",
  "➻",
  "➼",
  "➽",
  "➾",
  "⟰",
  "⟱",
  "⟴",
  "⟵",
  "⟶",
  "⟷",
  "⟸",
  "⟹",
  "⟺",
  "⟻",
  "⟼",
  "⟽",
  "⟾",
  "⟿",
  // Misc symbols used as icons.
  "⌕",
  "♙",
  "♟",
  "•",
  "×",
  "☀",
  "☾",
  "☽",
  "☑",
  "☒",
  "☐",
  "⚑",
  "⚐",
  "⚠",
  "⚙",
  "⏱",
  "⏳",
  "⌛",
  "⌚",
  "⏰",
  // Emoji used as icons.
  "☀️",
  "🌙",
  "⭐",
  "🌟",
  "✅",
  "❌",
  "⚠️",
  "🔒",
  "🔓",
  "🔍",
  "🔎",
  "🏆",
  "🎉",
  "📚",
  "📖",
  "🗑",
  "🗑️",
  "🔗",
  "📤",
  "📥",
  "💾",
  "🖼",
  "🖼️",
  "✏",
  "✏️",
  "🖊",
  "🖊️",
  "📝",
  "🔔",
  "🔕",
  "ℹ",
  "ℹ️",
  "❓",
  "❔",
  "❗",
  "❕",
  "⏸",
  "▶️",
  "⏹",
  "🔄",
  "🔃",
  "↔",
  "↕",
  "↩",
  "↪",
  "⤴",
  "⤵",
  "🔽",
  "🔼",
  "◀️",
  "⏪",
  "⏩",
  "⏫",
  "⏬",
] as const;

export type GlyphHit = {
  /** 1-based line of the offending node. */
  line: number;
  /** The rejected character. */
  glyph: string;
  /** A short excerpt of the surrounding text, for the failure message. */
  excerpt: string;
};

/**
 * `+` is the only glyph that legitimately appears inside technical strings:
 * HTML `pattern` attributes (`"[a-z0-9_]+"`) and base64 / argon2 hashes. It is
 * therefore rejected only when it is visible copy — a JSX text node — or when
 * a string literal is exactly `+` (the `{"+"}` form). Every other glyph is
 * rejected anywhere in a text node or a string literal.
 */
const AMBIGUOUS_GLYPHS: ReadonlySet<string> = new Set(["+"]);

function isHit(glyph: string, text: string, kind: "jsx" | "string"): boolean {
  if (!text.includes(glyph)) return false;
  if (kind === "jsx") return true;
  if (!AMBIGUOUS_GLYPHS.has(glyph)) return true;
  return text.trim() === glyph;
}

/**
 * Walks the AST of `source` and reports every rejected glyph found in a JSX
 * text node or a string literal. Comments and regex literals are not visited,
 * so they can never produce a hit.
 */
export function scanSource(source: string, fileName: string): GlyphHit[] {
  const scriptKind = fileName.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );

  const hits: GlyphHit[] = [];

  const inspect = (node: ts.Node, text: string, kind: "jsx" | "string"): void => {
    for (const glyph of ICON_GLYPHS) {
      if (!isHit(glyph, text, kind)) continue;
      hits.push({
        line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
        glyph,
        excerpt: text.replace(/\s+/g, " ").trim().slice(0, 60),
      });
    }
  };

  const visit = (node: ts.Node): void => {
    if (ts.isJsxText(node)) {
      inspect(node, node.getText(file), "jsx");
    } else if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node)
    ) {
      inspect(node, node.text, "string");
    }
    ts.forEachChild(node, visit);
  };

  visit(file);
  return hits;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function isExcluded(file: string): boolean {
  const rel = relative(SRC, file);
  if (rel.startsWith("app/dev/ui/")) return true;
  if (/\.test\.(ts|tsx)$/.test(rel)) return true;
  return false;
}

describe("icon glyph guard (DESIGN v2 §6)", () => {
  const files = walk(SRC).filter((file) => !isExcluded(file));

  it("scans the productive sources", () => {
    expect(files.length).toBeGreaterThan(50);
    expect(files.some((file) => file.endsWith("app-shell.tsx"))).toBe(true);
    expect(files.some((file) => file.includes("dev/ui"))).toBe(false);
  });

  it("never uses a text character as an icon", () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const hit of scanSource(source, file)) {
        offenders.push(
          `${relative(process.cwd(), file)}:${hit.line} uses "${hit.glyph}" in "${hit.excerpt}"`,
        );
      }
    }

    expect(offenders).toEqual([]);
  });

  // The guard is only useful if it actually fires. This self-test feeds a
  // synthetic component that places each documented glyph in the middle of a
  // button label, a link, a list item and a plain string, and asserts every
  // one of them is reported.
  it("detects the documented glyphs inside button, link and list text", () => {
    const sample = `
      export function Sample() {
        return (
          <div>
            <button type="button">Guardar ✓</button>
            <a href="/x">Volver ←</a>
            <ul>
              <li>• Primero</li>
              <li>▲ Arriba</li>
              <li>▣ Caja</li>
            </ul>
            <span>{"×"}</span>
            <span>{"⌕"}</span>
            <span>{"⇄"}</span>
            <span>{"♙"}</span>
            <span>{"→"}</span>
            <span>{"↑"}</span>
            <span>{"↓"}</span>
            <span>{"✕"}</span>
            <span>{"★"}</span>
          </div>
        );
      }
    `;

    const found = new Set(scanSource(sample, "sample.tsx").map((hit) => hit.glyph));
    const expected = [
      "✓",
      "←",
      "•",
      "▲",
      "▣",
      "×",
      "⌕",
      "⇄",
      "♙",
      "→",
      "↑",
      "↓",
      "✕",
      "★",
    ];

    for (const glyph of expected) {
      expect(found.has(glyph), `guard must detect "${glyph}"`).toBe(true);
    }
  });

  it("ignores comments and regular-expression literals", () => {
    const sample = `
      // The old button used "−" and "▦ Mosaico".
      /* ▲ ▼ ☷ ☰ */
      const pattern = /[.*+?^\${}()|[\\]\\\\]/g;
      export const ok = "sin glifos";
    `;

    expect(scanSource(sample, "sample.ts")).toEqual([]);
  });

  it("ignores technical strings that legitimately contain a plus sign", () => {
    const sample = `
      export const pattern = "[a-z0-9_]+";
      export const hash = "$argon2id$v=19$m=19456,t=2,p=1$Q0KIQ0w04flZ+1t4moUyCw$egYy9z";
    `;

    expect(scanSource(sample, "sample.ts")).toEqual([]);
  });

  it("still rejects a plus sign used as visible copy", () => {
    const jsx = `export const A = () => <button type="button">+</button>;`;
    const literal = `export const B = () => <button type="button">{"+"}</button>;`;

    expect(scanSource(jsx, "a.tsx").map((hit) => hit.glyph)).toEqual(["+"]);

    // `{"+"}` is a string literal, so it is only rejected because the literal
    // is exactly the glyph.
    expect(scanSource(literal, "b.tsx").map((hit) => hit.glyph)).toEqual(["+"]);

    // A longer technical literal is not visible copy and must stay clean.
    expect(scanSource(`export const C = "[a-z]+";`, "c.ts")).toEqual([]);
  });
});
