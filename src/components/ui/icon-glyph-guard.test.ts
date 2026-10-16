import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * DESIGN v2 §6 / §11 — glyph guard.
 *
 * The product must never use a text character as an icon. Every icon comes
 * from `src/components/ui/icons.tsx` (Lucide). This test fails if any of the
 * characters that used to stand in for icons reappears in an icon position
 * anywhere under `src/`.
 *
 * Scope:
 *   - `/dev/ui` is the isolated visual laboratory and is explicitly excluded.
 *   - `*.test.*` files are excluded (they legitimately assert on copy).
 *
 * "Icon position" means either a JSX text child (`>−<`) or a standalone
 * string literal (`"▦ Mosaico"`). Comments are stripped first, so prose that
 * mentions a glyph (for example a doc comment explaining the old behaviour)
 * does not trip the guard.
 */
const SRC = resolve(process.cwd(), "src");

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
  "➕",
  "➖",
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
  "▶️",
  "⏪",
  "⏩",
  "⏫",
  "⏬",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Removes `/* … *​/` blocks and `// …` line comments. The `[^:]` guard keeps
 * `https://` intact.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
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

const GLYPH_PATTERNS = ICON_GLYPHS.map((glyph) => {
  const escaped = escapeRegExp(glyph);
  return {
    glyph,
    // JSX text child: `>−<`, `>▦ Mosaico<`
    jsxChild: new RegExp(`>\\s*${escaped}`),
    // Standalone string literal: `"−"`, `"▦ Mosaico"`, `'☷ Lista'`
    stringLiteral: new RegExp(`["'\`]${escaped}`),
  };
});

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
      const source = stripComments(readFileSync(file, "utf8"));
      const lines = source.split("\n");
      lines.forEach((line, index) => {
        for (const { glyph, jsxChild, stringLiteral } of GLYPH_PATTERNS) {
          if (jsxChild.test(line) || stringLiteral.test(line)) {
            offenders.push(
              `${relative(process.cwd(), file)}:${index + 1} uses "${glyph}" as an icon`,
            );
          }
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
