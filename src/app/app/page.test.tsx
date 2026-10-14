import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Integration tests for the REAL `/app` Server Component.
 *
 * The module under test is `src/app/app/page.tsx`. Every external boundary is
 * mocked before import:
 *
 *   - `next/navigation`             -> `redirect` (throws, like Next.js does)
 *   - `@/lib/auth/current-user`     -> `getCurrentUser`
 *   - `@/app/logout/actions`        -> `logoutAction`
 *   - `@/lib/collection/drizzle...` -> no real database access
 *   - `@/lib/collection/service`    -> inspectable fake service
 *
 * UI-05B: the markup now uses `AlbumCard` (`<article>` + `<h2>`), an empty
 * state with copy + CTA, and a CTA that targets `/app/albums/<id>`. The
 * asserts in this file are updated to match that contract; they remain
 * non-snapshot to stay diff-friendly.
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

vi.mock("@/app/app/albums/add-button", () => ({
  AddAlbumButton: ({ albumId }: { albumId: string }) => (
    <button data-testid="add-album-button" data-album-id={albumId} type="button">
      Añadir a mi colección
    </button>
  ),
}));

import AppPage from "./page";

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

    const text = renderToStaticMarkup(await AppPage());

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(text).toContain("Mis álbumes");
    expect(text).toContain("Colección de erin");
    expect(text).toContain("Tu colección está vacía");
    expect(text).toContain("Hola, erin. Añade tu primer álbum para empezar a registrar tus láminas.");
    expect(text).toContain("Explorar álbumes");
    expect(text).toContain('href="/app/albums"');
  });

  it("renders own albums as AlbumCard articles with progress copy and CTAs", async () => {
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

    const text = renderToStaticMarkup(await AppPage());

    expect(mocks.listAlbumsForOwner).toHaveBeenCalledWith("user-1");
    expect(text).toContain("Minecraft");
    expect(text).toContain("Panini · 2026");
    expect(text).toContain("Otro álbum");
    expect(text).toContain("Sin datos editoriales");
    expect(text).toContain("32 / 240 láminas");
    expect(text).toContain("Abrir álbum");
    expect(text).toContain('href="/app/albums/collection-1"');
    expect(text).toContain('href="/app/albums/collection-2"');
    expect(text).toContain("Bajo");
    expect(text).toContain("aria-label=\"Mis álbumes\"");
    expect(text).toContain("<h2");
  });
});
