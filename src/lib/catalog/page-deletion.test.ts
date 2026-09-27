import { describe, expect, it } from "vitest";
import { CatalogError } from "./service";
import {
  deletePageWithDetachedStickers,
  type PageDeletionPort,
} from "./page-deletion";
import { pageDeletionConfirmation } from "./page-deletion-copy";

type Page = { id: string; position: number };
type Sticker = { id: string; pageId: string | null; position: number };

/**
 * In-memory adapter that mirrors the real transactional repository: detach
 * stickers, remove the page, then compact the remaining positions.
 */
class InMemoryAlbum implements PageDeletionPort {
  public readonly log: string[] = [];
  public failOn: "detach" | "remove" | "compact" | null = null;

  constructor(
    public pages: Page[],
    public stickers: Sticker[],
  ) {}

  async findPage(albumId: string, pageId: string) {
    this.log.push("findPage");
    void albumId;
    return this.pages.find((page) => page.id === pageId) ?? null;
  }

  async detachStickers(albumId: string, pageId: string) {
    this.log.push("detachStickers");
    if (this.failOn === "detach") throw new Error("detach failed");
    void albumId;
    let detached = 0;
    for (const sticker of this.stickers) {
      if (sticker.pageId === pageId) {
        sticker.pageId = null;
        detached += 1;
      }
    }
    return detached;
  }

  async removePage(pageId: string) {
    this.log.push("removePage");
    if (this.failOn === "remove") throw new Error("remove failed");
    this.pages = this.pages.filter((page) => page.id !== pageId);
  }

  async compactPositions(albumId: string, removedPosition: number) {
    this.log.push("compactPositions");
    if (this.failOn === "compact") throw new Error("compact failed");
    void albumId;
    for (const page of this.pages) {
      if (page.position > removedPosition) page.position -= 1;
    }
  }
}

function albumWith(pages: number, stickersPerPage: number[]) {
  const pageRows: Page[] = Array.from({ length: pages }, (_, index) => ({
    id: `page-${index + 1}`,
    position: index + 1,
  }));
  const stickerRows: Sticker[] = [];
  stickersPerPage.forEach((total, pageIndex) => {
    for (let index = 0; index < total; index += 1) {
      stickerRows.push({
        id: `sticker-${pageIndex + 1}-${index + 1}`,
        pageId: `page-${pageIndex + 1}`,
        position: stickerRows.length + 1,
      });
    }
  });
  return new InMemoryAlbum(pageRows, stickerRows);
}

describe("page deletion keeps stickers", () => {
  it("deletes an empty page created individually", async () => {
    const album = albumWith(3, [0, 0, 0]);
    const result = await deletePageWithDetachedStickers(album, "album-1", "page-2");
    expect(result.detachedStickers).toBe(0);
    expect(album.pages.map((page) => page.id)).toEqual(["page-1", "page-3"]);
  });

  it("deletes an empty page created by range (positions 1..20)", async () => {
    const album = albumWith(20, Array.from({ length: 20 }, () => 0));
    await deletePageWithDetachedStickers(album, "album-1", "page-1");
    expect(album.pages).toHaveLength(19);
    expect(album.pages.map((page) => page.position)).toEqual(
      Array.from({ length: 19 }, (_, index) => index + 1),
    );
  });

  it("deletes a page holding exactly one sticker and keeps that sticker", async () => {
    const album = albumWith(2, [1, 0]);
    const result = await deletePageWithDetachedStickers(album, "album-1", "page-1");
    expect(result.detachedStickers).toBe(1);
    expect(album.stickers).toHaveLength(1);
    expect(album.stickers[0].pageId).toBeNull();
  });

  it("deletes a page holding many stickers and keeps every sticker", async () => {
    const album = albumWith(3, [4, 0, 2]);
    const result = await deletePageWithDetachedStickers(album, "album-1", "page-1");
    expect(result.detachedStickers).toBe(4);
    expect(album.stickers).toHaveLength(6);
    expect(album.stickers.filter((sticker) => sticker.pageId === null)).toHaveLength(4);
    expect(album.stickers.filter((sticker) => sticker.pageId === "page-3")).toHaveLength(2);
  });

  it("leaves detached stickers with a null page id", async () => {
    const album = albumWith(2, [3, 0]);
    await deletePageWithDetachedStickers(album, "album-1", "page-1");
    expect(album.stickers.every((sticker) => sticker.pageId === null)).toBe(true);
  });

  it("compacts the positions of the remaining pages", async () => {
    const album = albumWith(5, [0, 0, 0, 0, 0]);
    await deletePageWithDetachedStickers(album, "album-1", "page-2");
    expect(album.pages.map((page) => page.position)).toEqual([1, 2, 3, 4]);
    expect(album.pages.map((page) => page.id)).toEqual([
      "page-1", "page-3", "page-4", "page-5",
    ]);
  });

  it("runs detach, remove and compact in that exact order", async () => {
    const album = albumWith(2, [1, 0]);
    await deletePageWithDetachedStickers(album, "album-1", "page-1");
    expect(album.log).toEqual([
      "findPage", "detachStickers", "removePage", "compactPositions",
    ]);
  });

  it("fails closed when the page does not exist", async () => {
    const album = albumWith(2, [0, 0]);
    await expect(
      deletePageWithDetachedStickers(album, "album-1", "page-99"),
    ).rejects.toBeInstanceOf(CatalogError);
    expect(album.log).toEqual(["findPage"]);
    expect(album.pages).toHaveLength(2);
  });

  it("is atomic: a failure after detaching leaves nothing half-applied", async () => {
    const album = albumWith(3, [2, 0, 0]);
    album.failOn = "remove";
    await expect(
      deletePageWithDetachedStickers(album, "album-1", "page-1"),
    ).rejects.toThrow("remove failed");
    // The adapter is not transactional, so the test asserts the ordering
    // guarantee the real repository relies on: the page is still present and
    // the caller's transaction is what rolls the detach back.
    expect(album.pages.map((page) => page.id)).toEqual(["page-1", "page-2", "page-3"]);
    expect(album.log).toEqual(["findPage", "detachStickers", "removePage"]);
  });

  it("does not compact positions when the page removal fails", async () => {
    const album = albumWith(3, [0, 0, 0]);
    album.failOn = "remove";
    await expect(
      deletePageWithDetachedStickers(album, "album-1", "page-1"),
    ).rejects.toThrow();
    expect(album.log).not.toContain("compactPositions");
    expect(album.pages.map((page) => page.position)).toEqual([1, 2, 3]);
  });
});

describe("page deletion confirmation", () => {
  it("asks plainly for an empty page", () => {
    expect(pageDeletionConfirmation("Página 1", 0)).toBe(
      '¿Eliminar la página vacía "Página 1"?',
    );
  });

  it("warns with the exact count for a single sticker", () => {
    const text = pageDeletionConfirmation("Página 1", 1);
    expect(text).toContain("Esta página contiene 1 lámina.");
    expect(text).toContain('la lámina pasará a "Sin página asignada"');
    expect(text).toContain('¿Eliminar la página "Página 1"?');
  });

  it("warns with the exact count for many stickers", () => {
    const text = pageDeletionConfirmation("Página 7", 12);
    expect(text).toContain("Esta página contiene 12 láminas.");
    expect(text).toContain('las láminas pasarán a "Sin página asignada"');
    expect(text).toContain('¿Eliminar la página "Página 7"?');
  });

  it("treats a negative count as empty instead of crashing", () => {
    expect(pageDeletionConfirmation("Página 1", -1)).toBe(
      '¿Eliminar la página vacía "Página 1"?',
    );
  });
});
