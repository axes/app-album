// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * UI-05B: integration tests for the `/app/albums` Server Component.
 *
 * The page renders the catalog of published albums and decides between the
 * "En mi colección" branch (link) and the "add" branch (server-action
 * form). External boundaries (`next/navigation`, `getCurrentUser`, the
 * Drizzle repository and the `CollectionService`) are mocked before import.
 *
 * `AddAlbumButton` is also stubbed: the unit-level behaviour lives in
 * `album-card.test.tsx`. Here we just need to assert that the form
 * structure survives into the rendered HTML.
 */
const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  getCurrentUser: vi.fn(),
  listPublishedAlbums: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/collection/drizzle-repository", () => ({
  DrizzleCollectionRepository: class {},
}));

vi.mock("@/lib/collection/service", () => ({
  CollectionService: class {
    listPublishedAlbums = mocks.listPublishedAlbums;
  },
  CollectionError: class extends Error {},
}));

vi.mock("@/app/app/albums/add-button", () => ({
  AddAlbumButton: ({ albumId }: { albumId: string }) => (
    <form data-testid="add-album-form" data-album-id={albumId}>
      <input name="albumId" type="hidden" value={albumId} />
      <button type="submit">Añadir a mi colección</button>
    </form>
  ),
}));

import AlbumsPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listPublishedAlbums.mockResolvedValue([]);
});

describe("/app/albums Server Component", () => {
  it("redirects to /login when getCurrentUser() returns null", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(AlbumsPage()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("shows the empty state when no published albums are available", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", username: "erin", role: "user", status: "active" });

    const text = renderToStaticMarkup(await AlbumsPage());

    expect(text).toContain("Explorar álbumes");
    expect(text).toContain("No hay álbumes disponibles");
    expect(text).not.toContain("aria-label=\"Álbumes disponibles\"");
    // The empty state offers no action: there is nothing useful to do when
    // nothing is published, so "Explorar álbumes" stays as the page title only.
    expect(text.match(/Explorar álbumes/g)).toHaveLength(1);
  });

  it("renders the in-collection variant with badge and link when userAlbumId is set", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", username: "erin", role: "user", status: "active" });
    mocks.listPublishedAlbums.mockResolvedValue([
      {
        id: "album-1",
        title: "Minecraft",
        publisher: "Panini",
        year: 2026,
        coverUrl: null,
        status: "published",
        stickerCount: 240,
        userAlbumId: "collection-9",
      },
    ]);

    const text = renderToStaticMarkup(await AlbumsPage());

    expect(text).toContain("Minecraft");
    expect(text).toContain("Panini · 2026");
    expect(text).toContain("240 láminas");
    expect(text).toContain("En mi colección");
    expect(text).toContain('href="/app/albums/collection-9"');
    expect(text).not.toContain("data-testid=\"add-album-form\"");
  });

  it("renders the add variant with a hidden albumId input when not in collection", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", username: "erin", role: "user", status: "active" });
    mocks.listPublishedAlbums.mockResolvedValue([
      {
        id: "album-1",
        title: "Minecraft",
        publisher: "Panini",
        year: 2026,
        coverUrl: null,
        status: "published",
        stickerCount: 240,
        userAlbumId: null,
      },
    ]);

    const text = renderToStaticMarkup(await AlbumsPage());

    expect(text).toContain("Minecraft");
    expect(text).toContain("data-testid=\"add-album-form\"");
    expect(text).toContain('data-album-id="album-1"');
    expect(text).toContain('name="albumId"');
    expect(text).not.toContain("En mi colección");
  });
});
