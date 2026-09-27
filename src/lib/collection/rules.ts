import type { AlbumStatus } from "@/lib/db/schema";
import { CollectionError } from "./service";

export function assertAlbumIsPublishable(status: AlbumStatus) {
  if (status !== "published") throw new CollectionError("album_not_published");
}

export function assertStickerBelongsToAlbum(
  sticker: { albumId: string } | null,
  albumId: string,
) {
  if (!sticker || sticker.albumId !== albumId) {
    throw new CollectionError("sticker_not_in_album");
  }
}
