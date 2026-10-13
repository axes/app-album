import { describe, expect, it } from "vitest";
import { buildReferencePackage, buildReferenceZip } from "./build-ui-reference";
import {
  colorTokens,
  motionTokens,
  proposalColorTokens,
  proposalRadiusTokens,
  proposalShadowTokens,
  semanticColorKeys,
} from "./ui-tokens";

function file(name: string): string {
  return buildReferencePackage().find((entry) => entry.name === name)!.contents;
}

describe("build-ui-reference UI-04A.3", () => {
  it("produces the four expected portable files in stable order", () => {
    expect(buildReferencePackage().map((entry) => entry.name)).toEqual([
      "index.html",
      "ui-tokens.css",
      "design-tokens.json",
      "README.md",
    ]);
  });

  it("is deterministic", () => {
    expect(buildReferenceZip().equals(buildReferenceZip())).toBe(true);
    expect(buildReferencePackage()).toEqual(buildReferencePackage());
  });

  it("serializes symmetric current/proposed semantic maps", () => {
    const json = JSON.parse(file("design-tokens.json"));
    for (const theme of ["light", "dark"] as const) {
      expect(Object.keys(json.color.current[theme])).toEqual([...semanticColorKeys]);
      expect(Object.keys(json.color.proposed[theme])).toEqual([...semanticColorKeys]);
      for (const key of semanticColorKeys) {
        expect(json.color.current[theme][key]).toBe(colorTokens[key][theme]);
        expect(json.color.proposed[theme][key]).toBe(proposalColorTokens[key][theme]);
      }
    }
    expect(json.radiusProposal).toEqual(proposalRadiusTokens);
    expect(json.shadowProposal).toEqual(proposalShadowTokens);
    expect(json.motion).toEqual(motionTokens);
  });

  it("emits proposal colour, radius, shadow and motion variables from tokens", () => {
    const css = file("ui-tokens.css");
    expect(css).toContain("Generated from scripts/ui-tokens.ts");
    for (const key of semanticColorKeys) {
      expect(css).toContain(proposalColorTokens[key].light);
      expect(css).toContain(proposalColorTokens[key].dark);
    }
    for (const pair of Object.values(proposalShadowTokens)) {
      expect(css).toContain(pair.light);
      expect(css).toContain(pair.dark);
    }
    expect(css).toContain("--radius-proposal-control");
    expect(css).toContain("--shadow-sm:");
    expect(css).not.toContain("--shadow-shadow-");
    expect(css).toContain(`--motion-normal: ${motionTokens.motionNormal}`);
  });

  it("contains the complete portable visual showcase", () => {
    const html = file("index.html");
    expect(html).toContain('<html lang="es" data-theme="light" data-direction="proposal">');
    expect(html).toContain("root.setAttribute('data-direction',safe)");
    expect(html).not.toContain("page.setAttribute('data-direction',safe)");
    expect(html).toContain('data-direction-value="current"');
    expect(html).toContain('data-direction-value="proposal"');
    expect(html).toContain('data-showcase="proposal"');
    expect(html.match(/class="identity-placeholder"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Placeholder de identidad App Álbum"');
    expect(html).not.toMatch(/<symbol id="mark"|<use href="#mark"|linearGradient/);
    expect(html).toContain("App Álbum — Propuesta de diseño");
    expect(html).toContain("Componentes del álbum");
    expect(html).toContain("Estado vacío y navegación móvil");
    expect(html.match(/data-sticker="\d+"/g)).toHaveLength(24);
    expect(html.match(/class="slot(?: on)? foil/g)).toHaveLength(4);
    expect(html).toContain("×2");
    expect(html).toContain('aria-valuenow="67"');
    expect(html).toContain('aria-label="Navegación inferior"');
    expect(html.match(/<nav class="nav"[\s\S]*?<svg viewBox="0 0 24 24"/g)).toHaveLength(1);
    expect(html).toContain("states[number]=(states[number]+1)%3");
    expect(html).toContain("grid-template-columns:repeat(auto-fill,minmax(72px,1fr))");
  });

  it("uses token variables for swatch paint while showing source values", () => {
    const html = file("index.html");
    expect(html).toContain("background:var(--album-proposal-primary)");
    expect(html).toContain(`<code>${proposalColorTokens.primary.light}</code>`);
    expect(html).toContain(`<code>${proposalColorTokens.primary.dark}</code>`);
  });

  it("keeps file:// compatibility and contains no runtime, remote resource or secret", () => {
    const all = buildReferencePackage().map((entry) => entry.contents).join("\n");
    expect(file("index.html")).toContain('href="./ui-tokens.css"');
    expect(all).not.toMatch(/https?:\/\/|_next\/|__NEXT_DATA__|nextjs-portal/i);
    expect(all).not.toMatch(/@font-face|data:font|data:image|\.png|\.jpg|\.webp/i);
    expect(all).not.toMatch(/DATABASE_URL|AUTH_SECRET|VERCEL_ENV|NEON_API_KEY/i);
  });

  it("documents centralization and experimental isolation", () => {
    const readme = file("README.md");
    expect(readme).toContain("scripts/ui-tokens.ts");
    expect(readme).toContain("Current y proposed comparten");
    expect(readme).toContain("no modifica producto");
    expect(readme).toContain("Poppins no está instalada");
    expect(readme).toContain("placeholder cuadrado simple");
  });
});
