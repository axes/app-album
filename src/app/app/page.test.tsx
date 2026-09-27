import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

/**
 * Integration tests for the REAL `/app` Server Component.
 *
 * The module under test is `src/app/app/page.tsx`. Every external boundary is
 * mocked before import:
 *
 *   - `next/navigation`             -> `redirect` (throws, like Next.js does)
 *   - `@/lib/auth/current-user`     -> `getCurrentUser`
 *   - `@/app/logout/actions`        -> `logoutAction`
 *   - `@/app/app/collection-nav`    -> leaves the component in place so we
 *                                     exercise navigation contract
 *   - `@/lib/collection/drizzle...` -> no real database access
 *   - `@/lib/collection/service`    -> inspectable fake service
 *
 * The `CollectionNav` component used to be inlined into the page; now it owns
 * the logout form. Tests for that responsibility live in
 * `collection-nav.test.tsx` next to the component.
 */
const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  getCurrentUser: vi.fn(),
  logoutAction: vi.fn(),
  listAlbumsForOwner: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/app/logout/actions", () => ({
  logoutAction: mocks.logoutAction,
}));

vi.mock("@/lib/collection/drizzle-repository", () => ({
  DrizzleCollectionRepository: class {},
}));

vi.mock("@/lib/collection/service", () => ({
  CollectionService: class {
    listAlbumsForOwner = mocks.listAlbumsForOwner;
  },
  CollectionError: class extends Error {},
}));

import AppPage from "./page";

function collectText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(collectText).join("");
  }
  const element = node as ReactElement<{ children?: ReactNode }>;
  return collectText(element.props?.children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listAlbumsForOwner.mockResolvedValue([]);
});

describe("/app Server Component", () => {
  it("redirects to /login when getCurrentUser() returns null", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(AppPage()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("shows the empty state with an exploration entry point", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      username: "erin",
      role: "user",
      status: "active",
    });

    const text = collectText(await AppPage());

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(text).toContain("erin");
    expect(text).toContain("Todavía no tienes álbumes en tu colección.");
    expect(text).toContain("Explorar álbumes");
  });

  it("renders own albums and their derived progress from the service", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", username: "erin", role: "user", status: "active" });
    mocks.listAlbumsForOwner.mockResolvedValue([
      {
        id: "collection-1", userId: "user-1", albumId: "album-1", createdAt: new Date(),
        album: { id: "album-1", title: "Minecraft", publisher: "Panini", year: 2026, coverUrl: null, status: "published" },
        progress: { owned: 32, total: 240, missing: 208, duplicates: 7, percentage: 13 },
      },
      {
        id: "collection-2", userId: "user-1", albumId: "album-2", createdAt: new Date(),
        album: { id: "album-2", title: "Otro álbum", publisher: null, year: null, coverUrl: null, status: "draft" },
        progress: { owned: 1, total: 10, missing: 9, duplicates: 0, percentage: 10 },
      },
    ]);

    const text = collectText(await AppPage());

    expect(mocks.listAlbumsForOwner).toHaveBeenCalledWith("user-1");
    expect(text).toContain("Minecraft");
    expect(text).toContain("Panini");
    expect(text).toContain("Otro álbum");
    expect(text).toContain("Abrir álbum");
  });
});
