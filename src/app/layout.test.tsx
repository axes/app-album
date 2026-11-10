// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * DESIGN v2 §14 — the logo definitions must exist exactly once per document.
 *
 * `Logo` renders `<use href="#mark"/>`, which only resolves if the `<symbol>`
 * and its gradients are present in the same document. They are declared by
 * `LogoDefs` in the root layout, so this test renders the real root layout and
 * asserts the document carries exactly one `#mark` symbol and one of each
 * gradient.
 *
 * The layout imports `next/font/google`, which cannot run in jsdom, so the
 * font module is stubbed. Everything else (the layout tree, `LogoDefs`, the
 * theme script) is the real thing.
 */
vi.mock("next/font/google", () => ({
  Poppins: () => ({ variable: "--font-poppins", className: "font-poppins" }),
  Inter: () => ({ variable: "--font-inter", className: "font-inter" }),
}));

import RootLayout, { metadata } from "./layout";

function renderLayout(): string {
  return renderToStaticMarkup(
    <RootLayout>
      <main>contenido</main>
    </RootLayout>,
  );
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe("root layout logo definitions (DESIGN v2 §14)", () => {
  const html = renderLayout();

  it("declares exactly one <symbol id=\"mark\"> in the document", () => {
    expect(countOccurrences(html, 'id="mark"')).toBe(1);
    expect(countOccurrences(html, "<symbol")).toBe(1);
  });

  it("declares each gradient exactly once", () => {
    for (const id of ["g1", "g2", "g3"]) {
      expect(countOccurrences(html, `id="${id}"`), `id="${id}"`).toBe(1);
    }
  });

  it("keeps the definitions invisible and out of the layout flow", () => {
    expect(html).toContain('data-component="logo-defs"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="0"');
    expect(html).toContain('height="0"');
  });

  it("renders the children alongside the definitions", () => {
    expect(html).toContain("contenido");
  });

  it("uses the visible product name in the metadata title", () => {
    // Next.js injects `metadata` into <head> outside the component tree, so
    // the rendered markup never carries the <title>. Assert on the exported
    // metadata object instead.
    expect(metadata.title).toBe("MiColección");
  });
});
