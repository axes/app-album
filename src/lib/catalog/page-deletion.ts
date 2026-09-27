import { CatalogError } from "./service";

/**
 * Minimal port required to delete a page while preserving its stickers.
 *
 * Keeping the rule behind a port lets the orchestration be unit-tested with an
 * in-memory adapter, while the Drizzle repository supplies the real
 * transactional implementation.
 */
export type PageDeletionPort = {
  findPage(albumId: string, pageId: string): Promise<{ id: string; position: number } | null>;
  /** Detaches every sticker of the page to `section_id = null`. Returns how many. */
  detachStickers(albumId: string, pageId: string): Promise<number>;
  removePage(pageId: string): Promise<void>;
  /** Shifts every position above `removedPosition` down by one. */
  compactPositions(albumId: string, removedPosition: number): Promise<void>;
};

export type PageDeletionResult = { detachedStickers: number };

/**
 * Deletes a page without ever deleting its stickers.
 *
 * Order matters: stickers are detached first, then the page is removed, then the
 * remaining positions are compacted. Callers must run this inside a single
 * transaction so a failure at any step leaves the album untouched.
 */
export async function deletePageWithDetachedStickers(
  port: PageDeletionPort,
  albumId: string,
  pageId: string,
): Promise<PageDeletionResult> {
  const page = await port.findPage(albumId, pageId);
  if (!page) throw new CatalogError("not_found");
  const detachedStickers = await port.detachStickers(albumId, pageId);
  await port.removePage(pageId);
  await port.compactPositions(albumId, page.position);
  return { detachedStickers };
}
