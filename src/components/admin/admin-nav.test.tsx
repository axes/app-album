// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  pathname: "/admin/albums",
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
    "aria-current"?: "page";
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

import { ADMIN_NAV_ITEMS, AdminNav } from "./admin-nav";

describe("AdminNav (Commit 1 — administrative navigation separation)", () => {
  it("publishes the two admin destinations with their DESIGN v2 icons", () => {
    expect(ADMIN_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/admin/albums",
      "/admin/users",
    ]);
    expect(ADMIN_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Administrar álbumes",
      "Administrar usuarios",
    ]);
    expect(ADMIN_NAV_ITEMS.map((item) => item.icon)).toEqual([
      "albums",
      "users",
    ]);
  });

  it("declares every item with a label, an icon and a unique href", () => {
    const hrefs = new Set<string>();
    for (const item of ADMIN_NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon.length).toBeGreaterThan(0);
      expect(hrefs.has(item.href)).toBe(false);
      hrefs.add(item.href);
    }
  });

  it("renders a nav labelled 'Navegación de administración' with one slot per item", () => {
    const html = renderToStaticMarkup(<AdminNav />);
    expect(html).toContain('aria-label="Navegación de administración"');
    expect(html).toContain('data-component="admin-nav"');
    const slots = html.match(/<li[^>]*class="admin-nav-slot[^"]*"/g);
    expect(slots?.length).toBe(ADMIN_NAV_ITEMS.length);
  });

  it("flags exactly one item with aria-current='page' on /admin/albums", () => {
    mocks.pathname = "/admin/albums";
    const { container } = render(<AdminNav />);
    const currents = Array.from(
      container.querySelectorAll('a[aria-current="page"]'),
    );
    expect(currents).toHaveLength(1);
    expect(currents[0]?.getAttribute("href")).toBe("/admin/albums");
  });

  it("keeps /admin/albums current on its detail route without a second current", () => {
    mocks.pathname = "/admin/albums/42";
    const { container } = render(<AdminNav />);
    const currents = Array.from(
      container.querySelectorAll('a[aria-current="page"]'),
    );
    expect(currents).toHaveLength(1);
    expect(currents[0]?.getAttribute("href")).toBe("/admin/albums");
  });

  it("flags only /admin/users on /admin/users", () => {
    mocks.pathname = "/admin/users";
    const { container } = render(<AdminNav />);
    const currents = Array.from(
      container.querySelectorAll('a[aria-current="page"]'),
    );
    expect(currents).toHaveLength(1);
    expect(currents[0]?.getAttribute("href")).toBe("/admin/users");
  });

  it("flags no current item outside the admin region", () => {
    mocks.pathname = "/app";
    const { container } = render(<AdminNav />);
    expect(
      container.querySelectorAll('a[aria-current="page"]'),
    ).toHaveLength(0);
  });
});
