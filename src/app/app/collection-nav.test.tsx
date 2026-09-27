import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  logoutAction: vi.fn(),
}));

vi.mock("@/app/logout/actions", () => ({
  logoutAction: mocks.logoutAction,
}));

import { CollectionNav } from "./collection-nav";

const user = { id: "u1", username: "erin", role: "user" as const, status: "active" as const };
const admin = { id: "a1", username: "root", role: "admin" as const, status: "active" as const };

function rendered(component: ReturnType<typeof CollectionNav>): string {
  return renderToStaticMarkup(component);
}

function hrefs(html: string): string[] {
  const matches = Array.from(html.matchAll(/<a[^>]*\bhref="([^"]+)"/g));
  return matches.map((entry) => entry[1]);
}

describe("CollectionNav", () => {
  it("renders the navigation links for a regular user", () => {
    const html = rendered(CollectionNav({ user }));
    expect(hrefs(html)).toContain("/app");
    expect(hrefs(html)).toContain("/app/albums");
    expect(hrefs(html)).not.toContain("/admin/albums");
    expect(hrefs(html)).not.toContain("/admin/users");
    expect(html).toContain("Mis álbumes");
    expect(html).toContain("Explorar álbumes");
  });

  it("includes admin entries for an admin user", () => {
    const html = rendered(CollectionNav({ user: admin }));
    expect(hrefs(html)).toContain("/app");
    expect(hrefs(html)).toContain("/app/albums");
    expect(hrefs(html)).toContain("/admin/albums");
    expect(hrefs(html)).toContain("/admin/users");
  });

  it("exposes the logout form bound to the logout action", () => {
    const html = rendered(CollectionNav({ user }));
    const formMatch = html.match(/<form[^>]*\baction="([^"]+)"[^>]*>([\s\S]*?)<\/form>/);
    expect(formMatch).not.toBeNull();
    expect(formMatch?.[1]).toBe("javascript:throw new Error(&#x27;React form unexpectedly submitted.&#x27;)");
    expect(html).toContain("Cerrar sesión");
    expect(mocks.logoutAction).not.toHaveBeenCalled();
  });
});
