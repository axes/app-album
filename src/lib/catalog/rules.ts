import type { AlbumStatus } from "@/lib/db/schema";
import { CatalogError } from "./service";

export function assertCanPublish(title: string, sectionCount: number, stickerCount: number) {
  // Pages are optional organization: an album may publish with 0 pages and any
  // number of stickers in `Sin página asignada`. The only hard requirement is a
  // non-empty body and a title.
  void sectionCount;
  if (!title.trim() || stickerCount < 1) {
    throw new CatalogError("publication_incomplete");
  }
}

export function assertCanDeleteAlbum(
  status: AlbumStatus,
  sectionCount: number,
  stickerCount: number,
  collectionCount = 0,
) {
  if (collectionCount > 0) throw new CatalogError("album_has_collections");
  if (status === "published") throw new CatalogError("published_delete");
  if (sectionCount > 0 || stickerCount > 0) throw new CatalogError("album_not_empty");
}

export function assertSectionBelongsToAlbum(sectionAlbumId: string | null, albumId: string) {
  if (sectionAlbumId !== albumId) throw new CatalogError("invalid_section");
}

/**
 * Deleting a page never deletes its stickers: they are detached to
 * `section_id = null` ("Sin página asignada") before the page is removed.
 * This helper only documents the invariant for callers and tests.
 */
export function assertPageDeletionKeepsStickers(stickerCount: number) {
  if (stickerCount < 0) throw new CatalogError("invalid_input");
}

export type AlbumAuditAction = "create" | "publish" | "unpublish" | "delete";

export function auditActionForStatus(status: AlbumStatus): AlbumAuditAction {
  return status === "published" ? "publish" : "unpublish";
}

export function assertStickerCodeAvailable(
  existing: Array<{ albumId: string; code: string }>,
  albumId: string,
  code: string,
) {
  if (existing.some((sticker) => sticker.albumId === albumId && sticker.code === code)) {
    throw new CatalogError("duplicate_code");
  }
}
