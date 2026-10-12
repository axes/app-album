import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  logoutAction: vi.fn(),
}));

vi.mock("@/app/logout/actions", () => ({
  logoutAction: mocks.logoutAction,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <span data-testid="theme-toggle" />,
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

describe("AppShell", () => {
  it("renders the public navigation and no logout when there is no user", () => {
    const html = rendered({ children: "contenido" });

    expect(hrefs(html)).toContain("/login");
    expect(hrefs(html)).toContain("/register");
    expect(hrefs(html)).not.toContain("/app");
    expect(hrefs(html)).not.toContain("/admin/albums");
    expect(html).toContain("contenido");
    expect(html).toContain('data-testid="theme-toggle"');
    expect(html).not.toContain("Cerrar sesión");
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
});
