// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

/**
 * Integration tests for the REAL `/share/[token]` Server Component.
 *
 * `next/navigation` is mocked so `notFound()` throws a sentinel (as Next.js
 * does), and the collection layer is replaced by an inspectable fake so the
 * suite never touches PostgreSQL. The resolved element is rendered with
 * Testing Library so child components (e.g. `StickerList`) actually execute and
 * the assertions run against the real DOM instead of the unrendered element
 * tree. The public DTO is asserted to be free of internal identifiers and
 * account data.
 */
const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  getPublicAlbumByToken: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/lib/collection/drizzle-repository", () => ({
  DrizzleCollectionRepository: class {},
}));

vi.mock("@/lib/collection/service", () => ({
  CollectionService: class {
    getPublicAlbumByToken = mocks.getPublicAlbumByToken;
  },
}));

import SharedAlbumPage, { metadata } from "./page";

const TOKEN = "a".repeat(43);

const view = {
  album: { title: "Minecraft", publisher: "Panini", year: 2026, coverUrl: null },
  progress: { total: 4, owned: 2, missing: 2, duplicates: 1, percentage: 50 },
  missing: [
    { name: "Página 1", stickers: [{ code: "A2", name: "Creeper" }] },
    { name: "Sin página asignada", stickers: [{ code: "LOGO", name: null }] },
  ],
  duplicates: [{ name: "Página 1", stickers: [{ code: "A1", name: null, duplicates: 1 }] }],
};

/** Renders the resolved Server Component output and returns the live DOM text. */
async function renderShared(token = TOKEN) {
  const element = await SharedAlbumPage({ params: Promise.resolve({ token }) });
  const { container } = render(element);
  return container;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("/share/[token] Server Component", () => {
  it("renders the public view without requiring a session", async () => {
    mocks.getPublicAlbumByToken.mockResolvedValue(view);

    const container = await renderShared();

    expect(mocks.getPublicAlbumByToken).toHaveBeenCalledWith(TOKEN);
    const text = container.textContent ?? "";
    expect(text).toContain("Minecraft");
    expect(text).toContain("Panini");
    expect(text).toContain("2 / 4 láminas · 50%");
    expect(text).toContain("2 faltantes · 1 repetidas");
    // These codes/names are rendered by the child `StickerList` component, so
    // they only appear when the element is actually rendered.
    expect(screen.getByText("A2")).toBeTruthy();
    expect(screen.getByText("Creeper")).toBeTruthy();
    expect(screen.getByText("LOGO")).toBeTruthy();
    expect(text).toContain("Sin página asignada");
    expect(text).toContain("1 repetida");
  });

  it("calls notFound() for unknown, disabled or malformed tokens", async () => {
    mocks.getPublicAlbumByToken.mockResolvedValue(null);

    await expect(SharedAlbumPage({ params: Promise.resolve({ token: "short" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });

  it("declares noindex/nofollow metadata", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("shows the complete-album and no-duplicates states", async () => {
    mocks.getPublicAlbumByToken.mockResolvedValue({
      ...view,
      progress: { total: 4, owned: 4, missing: 0, duplicates: 0, percentage: 100 },
      missing: [],
      duplicates: [],
    });

    const container = await renderShared();
    const text = container.textContent ?? "";
    expect(text).toContain("Álbum completo");
    expect(text).toContain("Sin repetidas");
  });

  it("renders a zero-progress collection with every sticker missing", async () => {
    mocks.getPublicAlbumByToken.mockResolvedValue({
      ...view,
      progress: { total: 2, owned: 0, missing: 2, duplicates: 0, percentage: 0 },
      missing: [{ name: "Página 1", stickers: [{ code: "A1", name: null }, { code: "A2", name: null }] }],
      duplicates: [],
    });

    const container = await renderShared();
    const text = container.textContent ?? "";
    expect(text).toContain("0 / 2 láminas · 0%");
    expect(screen.getByText("A1")).toBeTruthy();
    expect(screen.getByText("A2")).toBeTruthy();
    expect(text).toContain("Sin repetidas");
  });

  it("never exposes account data or internal identifiers", async () => {
    mocks.getPublicAlbumByToken.mockResolvedValue(view);

    const container = await renderShared();
    const html = container.innerHTML;
    expect(html).not.toContain("erin");
    expect(html).not.toContain("@example.com");
    expect(html).not.toContain("admin");
    expect(html).not.toContain("user-1");
    expect(html).not.toContain("collection-1");
    expect(html).not.toContain("album-1");
    expect(html).not.toContain("sticker-1");
  });
});
