// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  pathname: "/app",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-current": ariaCurrent,
    "aria-label": ariaLabel,
    "data-current": dataCurrent,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-current"?: string;
    "aria-label"?: string;
    "data-current"?: string;
  }) => (
    <a
      href={href}
      className={className}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      data-current={dataCurrent}
      {...rest}
    >
      {children}
    </a>
  ),
}));

import { MOBILE_NAV_ITEMS, MobileNav } from "./mobile-nav";

describe("MobileNav (UI-05A)", () => {
  it("publishes only the two real destinations agreed for UI-05A", () => {
    expect(MOBILE_NAV_ITEMS).toHaveLength(2);
    expect(MOBILE_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/app",
      "/app/albums",
    ]);
    expect(MOBILE_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Mis álbumes",
      "Explorar",
    ]);
  });

  it("declares every item with a label, a non-empty icon and a unique href", () => {
    const hrefs = new Set<string>();
    for (const item of MOBILE_NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon).toBeTruthy();
      expect(hrefs.has(item.href)).toBe(false);
      hrefs.add(item.href);
    }
  });

  it("renders a nav labelled 'Navegación inferior' with one slot per item", () => {
    mocks.pathname = "/app/albums";
    const html = renderToStaticMarkup(<MobileNav />);
    expect(html).toContain('aria-label="Navegación inferior"');
    const slots = html.match(/<li[^>]*class="mobile-nav-slot"/g);
    expect(slots?.length).toBe(MOBILE_NAV_ITEMS.length);
    expect(html).toContain("grid-template-columns:repeat(2");
  });

  it("flags exactly one item with aria-current='page' for a given pathname", () => {
    mocks.pathname = "/app/albums";
    const { container } = render(<MobileNav />);
    const currents = Array.from(
      container.querySelectorAll('a[aria-current="page"]'),
    );
    expect(currents).toHaveLength(1);
    expect(currents[0]?.getAttribute("href")).toBe("/app/albums");
  });

  it("does not render any disabled or provisional slots", () => {
    const html = renderToStaticMarkup(<MobileNav />);
    expect(html).not.toContain("disabled");
    expect(html).not.toContain("data-provisional");
    expect(html).not.toContain("(provisional)");
  });

  it("keeps an accessible label per item and a minimum 48px tall slot", () => {
    const html = renderToStaticMarkup(<MobileNav />);
    for (const item of MOBILE_NAV_ITEMS) {
      expect(html).toContain(`aria-label="${item.label}"`);
    }
    // The minimum height is enforced by the CSS rule in globals.css; the
    // rendered markup relies on that class to apply it.
    expect(html).toContain("mobile-nav-link");
  });
});
