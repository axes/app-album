import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Integration tests for the REAL `/admin/albums` Server Component.
 *
 * The page itself only talks to the catalog service; the admin guard lives in
 * `src/app/admin/layout.tsx`, so no auth boundary is mocked here. The Drizzle
 * repository and the `CatalogService` are replaced before import so the test
 * never touches a database.
 *
 * UI-06C: the page now renders an `EmptyState` instead of a header-only table
 * when there are no albums. The asserts below pin both branches and the fact
 * that the empty state does NOT duplicate the "Crear álbum" action already
 * owned by the `PageHeader`.
 */
const mocks = vi.hoisted(() => ({
  listAlbums: vi.fn(),
}));

vi.mock("@/lib/catalog/drizzle-repository", () => ({
  DrizzleCatalogRepository: class {},
}));

vi.mock("@/lib/catalog/service", () => ({
  CatalogService: class {
    listAlbums = mocks.listAlbums;
  },
}));

import AdminAlbumsPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listAlbums.mockResolvedValue([]);
});

describe("/admin/albums Server Component", () => {
  it("shows the empty state instead of a bare table when there are no albums", async () => {
    const text = renderToStaticMarkup(await AdminAlbumsPage());

    expect(text).toContain("Todavía no hay álbumes");
    expect(text).not.toContain("<table");
    expect(text).not.toContain("<tbody");
    // The PageHeader already owns the creation action; the empty state must
    // not repeat it a few pixels below.
    expect(text.match(/Crear álbum/g)).toHaveLength(1);
  });

  it("renders the album table when albums exist", async () => {
    mocks.listAlbums.mockResolvedValue([
      {
        id: "album-1",
        title: "Minecraft",
        slug: "minecraft",
        status: "published",
        publisher: "Panini",
        year: 2026,
        coverUrl: null,
        sectionCount: 12,
        stickerCount: 240,
        collectionCount: 3,
      },
    ]);

    const text = renderToStaticMarkup(await AdminAlbumsPage());

    expect(text).not.toContain("Todavía no hay álbumes");
    expect(text).toContain("<table");
    expect(text).toContain("Minecraft");
    expect(text).toContain("minecraft");
    expect(text).toContain("Publicado");
    expect(text).toContain("Panini · 2026");
    expect(text).toContain('href="/admin/albums/album-1"');
  });
});
