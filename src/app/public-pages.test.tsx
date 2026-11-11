import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SITE } from "@/lib/site/info";
import HomePage from "./page";
import FaqPage from "./faq/page";
import { FAQ_GROUPS } from "./faq/content";
import TermsPage from "./terminos/page";
import { TERMS_SECTIONS, TERMS_UPDATED } from "./terminos/content";

// AppShell imports the logout Server Action, which pulls the server-only env.
vi.mock("@/app/logout/actions", () => ({ logoutAction: vi.fn() }));

describe("public information pages", () => {
  it("adds the site footer to the home page", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('data-component="site-footer"');
    expect(html).toContain('href="/faq"');
    expect(html).toContain('href="/terminos"');
  });

  it("renders every FAQ question with its answer", () => {
    const html = renderToStaticMarkup(<FaqPage />);
    expect(html).toContain("Preguntas frecuentes");
    const questions = FAQ_GROUPS.flatMap((group) => group.items);
    expect(questions.length).toBeGreaterThanOrEqual(12);
    for (const item of questions) {
      expect(item.answer.length).toBeGreaterThan(0);
      expect(html).toContain(item.question.replace(/&/g, "&amp;"));
    }
    expect(new Set(questions.map((item) => item.question)).size).toBe(questions.length);
    expect(html).toContain('data-component="site-footer"');
  });

  it("renders the terms with the update date, the operator and the contact", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain("Términos y condiciones");
    expect(html).toContain(TERMS_UPDATED);
    expect(html).toContain(SITE.owner);
    expect(html).toContain(SITE.contactEmail);
    for (const section of TERMS_SECTIONS) {
      expect(html).toContain(`id="${section.id}"`);
    }
    expect(new Set(TERMS_SECTIONS.map((section) => section.id)).size).toBe(TERMS_SECTIONS.length);
  });
});
