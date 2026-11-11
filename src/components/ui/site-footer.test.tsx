import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SITE } from "@/lib/site/info";
import { AppShell } from "./app-shell";
import { SiteFooter } from "./site-footer";
import { Wordmark } from "./wordmark";

// AppShell imports the logout Server Action, which pulls the server-only env.
vi.mock("@/app/logout/actions", () => ({ logoutAction: vi.fn() }));

describe("Wordmark", () => {
  it("renders the official name with the .cl domain as text, apart from the mark", () => {
    const html = renderToStaticMarkup(<Wordmark size="lg" />);
    expect(html).toContain('data-component="wordmark"');
    expect(html).toContain("MiColección");
    expect(html).toContain(".cl");
    expect(html).toContain("text-3xl");
    expect(html).not.toContain("<svg");
  });
});

describe("SiteFooter", () => {
  const html = renderToStaticMarkup(<SiteFooter year={2026} />);

  it("links to the FAQ, the terms and the contact address", () => {
    expect(html).toContain('href="/faq"');
    expect(html).toContain('href="/terminos"');
    expect(html).toContain(`href="mailto:${SITE.contactEmail}"`);
  });

  it("carries the wordmark and the copyright line", () => {
    expect(html).toContain('data-component="wordmark"');
    expect(html).toContain("© 2026 MiColección.cl");
  });

  it("is rendered by the shell after the main content only when provided", () => {
    const withFooter = renderToStaticMarkup(
      <AppShell footer={<SiteFooter year={2026} />}>contenido</AppShell>,
    );
    expect(withFooter.indexOf("</main>")).toBeLessThan(withFooter.indexOf('data-component="site-footer"'));
    expect(renderToStaticMarkup(<AppShell>contenido</AppShell>)).not.toContain("site-footer");
  });
});
