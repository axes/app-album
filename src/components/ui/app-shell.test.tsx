// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  logoutAction: vi.fn(),
  pathname: "/app",
}));

vi.mock("@/app/logout/actions", () => ({
  logoutAction: mocks.logoutAction,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <span data-testid="theme-toggle" />,
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

import { AppShell } from "./app-shell";

function rendered(props: Parameters<typeof AppShell>[0]): string {
  return renderToStaticMarkup(<AppShell {...props} />);
}

function hrefs(html: string): string[] {
  return Array.from(html.matchAll(/<a[^>]*\bhref="([^"]+)"/g)).map(
    (match) => match[1],
  );
}

describe("AppShell (UI-05A)", () => {
  it("renders the public navigation and no logout when there is no user", () => {
    const html = rendered({ children: "contenido" });

    expect(hrefs(html)).toContain("/login");
    expect(hrefs(html)).toContain("/register");
    // Header brand link points at "/": public shell never references the
    // private app routes in the header navigation.
    expect(hrefs(html)).not.toContain("/admin/albums");
    expect(html).toContain("contenido");
    expect(html).toContain('data-testid="theme-toggle"');
    expect(html).not.toContain("Cerrar sesión");
    expect(html).not.toContain('data-component="app-shell-dock"');
  });

  it("renders the authenticated navigation for a regular user", () => {
    const html = rendered({
      user: { username: "erin", role: "user" },
      children: "x",
    });

    expect(hrefs(html)).toContain("/app");
    expect(hrefs(html)).toContain("/app/albums");
    expect(hrefs(html)).not.toContain("/admin/albums");
    expect(hrefs(html)).not.toContain("/admin/users");
    expect(html).toContain("erin");
    expect(html).toContain("Cerrar sesión");
  });

  it("adds the admin entries only for an admin user", () => {
    const html = rendered({
      user: { username: "root", role: "admin" },
      children: "x",
    });

    expect(hrefs(html)).toContain("/admin/albums");
    expect(hrefs(html)).toContain("/admin/users");
  });

  it("binds the logout form to the logout action", () => {
    const html = rendered({
      user: { username: "erin", role: "user" },
      children: "x",
    });

    const formMatch = html.match(
      /<form[^>]*\baction="([^"]+)"[^>]*>([\s\S]*?)<\/form>/,
    );
    expect(formMatch).not.toBeNull();
    expect(formMatch?.[1]).toBe(
      "javascript:throw new Error(&#x27;React form unexpectedly submitted.&#x27;)",
    );
    expect(formMatch?.[2]).toContain("Cerrar sesión");
    expect(mocks.logoutAction).not.toHaveBeenCalled();
  });

  it("renders the token-driven logo placeholder in the header", () => {
    const html = rendered({ children: "x" });
    expect(html).toContain("logo-placeholder");
    expect(html).toContain('aria-label="Logo de App Álbum"');
    expect(html).toContain("App Álbum");
  });

  it("renders the mobile dock with the two real destinations on small viewports", () => {
    const html = rendered({
      user: { username: "erin", role: "user" },
      children: "x",
    });
    expect(html).toContain('data-component="app-shell-dock"');
    expect(html).toContain('aria-label="Navegación inferior"');
    expect(html).toContain('aria-label="Mis álbumes"');
    expect(html).toContain('aria-label="Explorar"');
    expect(html).toContain('data-item-count="2"');
  });

  it("renders four real mobile destinations for an admin", () => {
    const html = rendered({
      user: { username: "root", role: "admin" },
      children: "x",
    });
    expect(html).toContain('data-item-count="4"');
    expect(html).toContain('href="/admin/albums"');
    expect(html).toContain('href="/admin/users"');
  });

  it("renders the skip link first and targets the single main landmark", () => {
    const { container } = render(<AppShell>contenido</AppShell>);
    const firstLink = container.querySelector("a");
    const mains = container.querySelectorAll("main#main-content");
    expect(firstLink?.textContent).toContain("Saltar al contenido");
    expect(firstLink?.getAttribute("href")).toBe("#main-content");
    expect(firstLink?.className).toContain("focus:not-sr-only");
    expect(mains).toHaveLength(1);
  });

  it("flags exactly one aria-current='page' in the header nav on /app", () => {
    mocks.pathname = "/app";
    const { container } = render(
      <AppShell user={{ username: "erin", role: "user" }}>x</AppShell>,
    );
    const headerNav = container.querySelector(
      'nav[aria-label="Navegación principal"]',
    );
    const currents = headerNav?.querySelectorAll('[aria-current="page"]') ?? [];
    expect(currents.length).toBe(1);
  });

  it("flags exactly one aria-current='page' in the header nav on /app/albums", () => {
    mocks.pathname = "/app/albums";
    const { container } = render(
      <AppShell user={{ username: "erin", role: "user" }}>x</AppShell>,
    );
    const headerNav = container.querySelector(
      'nav[aria-label="Navegación principal"]',
    );
    const currents = headerNav?.querySelectorAll('[aria-current="page"]') ?? [];
    expect(currents.length).toBe(1);
  });

  it("flags exactly one aria-current='page' in the mobile dock on /app", () => {
    mocks.pathname = "/app";
    const { container } = render(
      <AppShell user={{ username: "erin", role: "user" }}>x</AppShell>,
    );
    const dock = container.querySelector(
      'nav[aria-label="Navegación inferior"]',
    );
    const currents = dock?.querySelectorAll('[aria-current="page"]') ?? [];
    expect(currents.length).toBe(1);
  });
});
