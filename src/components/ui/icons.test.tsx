// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ICONS, ICON_SIZES, Icon, type IconName } from "./icons";

const SRC = resolve(process.cwd(), "src");

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

/**
 * DESIGN v2 §6 — the mandatory semantic map.
 *
 * The keys are the contract: the same meaning must always resolve to the same
 * glyph across the whole app. This list is asserted literally so a rename or a
 * silent glyph swap fails the suite.
 */
const DESIGN_MAP: Record<string, IconName> = {
  albums: "albums",
  explore: "explore",
  profile: "profile",
  add: "add",
  remove: "remove",
  owned: "owned",
  repeated: "repeated",
  special: "special",
  completed: "completed",
  delete: "delete",
  swap: "swap",
  share: "share",
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  close: "close",
  menu: "menu",
  grid: "grid",
  lock: "lock",
  loading: "loading",
};

/** Extensions required by the product but not covered by DESIGN v2 §6. */
const DESIGN_EXTENSIONS: IconName[] = [
  "sun",
  "moon",
  "chevronUp",
  "chevronDown",
  "list",
  "pencil",
  "image",
  "back",
];

describe("Icon (DESIGN v2 §6)", () => {
  it("exposes every mandatory semantic name", () => {
    for (const name of Object.values(DESIGN_MAP)) {
      expect(Object.keys(ICONS), `missing icon "${name}"`).toContain(name);
    }
  });

  it("exposes only the documented extensions beyond the DESIGN map", () => {
    const documented = new Set<IconName>([
      ...Object.values(DESIGN_MAP),
      ...DESIGN_EXTENSIONS,
    ]);
    const undocumented = (Object.keys(ICONS) as IconName[]).filter(
      (name) => !documented.has(name),
    );
    expect(undocumented).toEqual([]);
  });

  it("renders a decorative 20 px icon by default", () => {
    const html = renderToStaticMarkup(<Icon name="albums" />);
    expect(html).toContain('width="20"');
    expect(html).toContain('height="20"');
    expect(html).toContain('stroke-width="2"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).toContain('data-icon="albums"');
  });

  it("maps the three DESIGN sizes to 16 / 20 / 24 px", () => {
    expect(ICON_SIZES).toEqual({ sm: 16, md: 20, lg: 24 });
    for (const [size, pixels] of Object.entries(ICON_SIZES)) {
      const html = renderToStaticMarkup(
        <Icon name="explore" size={size as keyof typeof ICON_SIZES} />,
      );
      expect(html).toContain(`width="${pixels}"`);
      expect(html).toContain(`height="${pixels}"`);
    }
  });

  it("throws a clear error for an unknown icon name", () => {
    // The map keys are semantic (`explore`), not Lucide names (`search`).
    // Passing a Lucide name must fail loudly instead of rendering `undefined`.
    expect(() =>
      renderToStaticMarkup(<Icon name={"search" as IconName} />),
    ).toThrowError(/unknown icon name "search"/);
    expect(() =>
      renderToStaticMarkup(<Icon name={"search" as IconName} />),
    ).toThrowError(/Valid names: albums, explore/);
  });

  it("becomes a labelled image when a label is provided", () => {
    const html = renderToStaticMarkup(<Icon name="warning" label="Aviso" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Aviso"');
    expect(html).not.toContain('aria-hidden="true"');
  });

  it("inherits the surrounding colour through currentColor", () => {
    const html = renderToStaticMarkup(<Icon name="info" />);
    expect(html).toContain('stroke="currentColor"');
  });
});

describe("lucide-react import boundary", () => {
  it("is imported only by src/components/ui/icons.tsx", () => {
    const offenders = walk(SRC)
      .filter((file) => !file.endsWith("icons.tsx"))
      .filter((file) => /from\s+["']lucide-react["']/.test(readFileSync(file, "utf8")))
      .map((file) => relative(process.cwd(), file));

    expect(offenders).toEqual([]);
  });

  it("uses per-icon named imports instead of a namespace import", () => {
    const source = readFileSync(join(SRC, "components/ui/icons.tsx"), "utf8");
    expect(source).toMatch(/from\s+["']lucide-react["']/);
    expect(source).not.toMatch(/import\s+\*\s+as\s+/);
  });
});
