import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  albumSections,
  albums,
  stickers,
  userAlbumStickers,
  userAlbums,
} from "@/lib/db/schema";
import {
  CollectionError,
  CollectionRepository,
  computeProgress,
  type AlbumHeader,
  type Progress,
  type PublishedAlbumListing,
  type StickerQuantityChange,
  type UserAlbum,
  type UserAlbumDetail,
  type UserAlbumListing,
} from "./service";
import { assertAlbumIsPublishable, assertStickerBelongsToAlbum } from "./rules";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function isUnique(error: unknown, constraint: string) {
  if (typeof error !== "object" || error === null) return false;
  const err = error as { code?: unknown; constraint_name?: unknown };
  return err.code === "23505" && err.constraint_name === constraint;
}

async function lockAlbum(tx: Tx, albumId: string) {
  // Catalog mutations use the same album-id key. Sharing it prevents an album
  // from becoming draft between this lock and the published-state check.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${albumId}))`);
}

async function lockUserAlbum(tx: Tx, userAlbumId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`collection:user-album:${userAlbumId}`}))`);
}

async function loadAlbumHeader(tx: Tx, albumId: string): Promise<AlbumHeader | null> {
  const [row] = await tx
    .select({
      id: albums.id, title: albums.title, publisher: albums.publisher, year: albums.year,
      coverUrl: albums.coverUrl, status: albums.status,
    })
    .from(albums)
    .where(eq(albums.id, albumId))
    .limit(1);
  return row ?? null;
}

async function loadOwnerOrForbid(tx: Tx, userAlbumId: string, userId: string): Promise<UserAlbum> {
  const [row] = await tx
    .select()
    .from(userAlbums)
    .where(and(eq(userAlbums.id, userAlbumId), eq(userAlbums.userId, userId)))
    .limit(1);
  if (!row) throw new CollectionError("forbidden");
  return row;
}

async function loadQuantitiesForUserAlbum(tx: Tx, userAlbumId: string): Promise<Map<string, number>> {
  const rows = await tx
    .select({ stickerId: userAlbumStickers.stickerId, quantity: userAlbumStickers.quantity })
    .from(userAlbumStickers)
    .where(eq(userAlbumStickers.userAlbumId, userAlbumId));
  const map = new Map<string, number>();
  for (const row of rows) map.set(row.stickerId, row.quantity);
  return map;
}

async function attachProgress(
  tx: Tx,
  rows: UserAlbum[],
): Promise<UserAlbumListing[]> {
  if (rows.length === 0) return [];
  const albumIds = Array.from(new Set(rows.map((row) => row.albumId)));
  const headers = await tx
    .select({
      id: albums.id, title: albums.title, publisher: albums.publisher, year: albums.year,
      coverUrl: albums.coverUrl, status: albums.status,
    })
    .from(albums)
    .where(inArray(albums.id, albumIds));
  const headerMap = new Map(headers.map((header) => [header.id, header]));
  const totals = new Map<string, number>();
  const totalRows = await tx
    .select({ albumId: stickers.albumId, value: sql<number>`count(*)::int` })
    .from(stickers)
    .where(inArray(stickers.albumId, albumIds))
    .groupBy(stickers.albumId);
  for (const row of totalRows) totals.set(row.albumId, row.value);
  const quantities = new Map<string, number[]>();
  const quantityRows = await tx
    .select({
      userAlbumId: userAlbumStickers.userAlbumId,
      stickerAlbumId: stickers.albumId,
      quantity: userAlbumStickers.quantity,
    })
    .from(userAlbumStickers)
    .innerJoin(stickers, eq(stickers.id, userAlbumStickers.stickerId))
    .where(inArray(userAlbumStickers.userAlbumId, rows.map((row) => row.id)));
  for (const row of quantityRows) {
    const bucket = quantities.get(row.userAlbumId) ?? [];
    bucket.push(row.quantity);
    quantities.set(row.userAlbumId, bucket);
  }
  return rows.map((row) => {
    const header = headerMap.get(row.albumId);
    if (!header) throw new CollectionError("not_found");
    const progress: Progress = computeProgress(
      quantities.get(row.id) ?? [],
      totals.get(row.albumId) ?? 0,
    );
    return { ...row, album: header, progress };
  });
}

export class DrizzleCollectionRepository implements CollectionRepository {
  async addAlbum(actorId: string, albumId: string): Promise<UserAlbum> {
    try {
      return await db.transaction(async (tx) => {
        await lockAlbum(tx, albumId);
        const header = await loadAlbumHeader(tx, albumId);
        if (!header) throw new CollectionError("not_found");
        assertAlbumIsPublishable(header.status);
        const [row] = await tx
          .insert(userAlbums)
          .values({ userId: actorId, albumId })
          .returning();
        if (!row) throw new Error("Insert failed");
        return row;
      });
    } catch (error) {
      if (isUnique(error, "user_albums_user_album_unique")) {
        throw new CollectionError("duplicate_collection");
      }
      throw error;
    }
  }

  async getAlbumForOwner(userId: string, userAlbumId: string): Promise<UserAlbum | null> {
    const [row] = await db
      .select()
      .from(userAlbums)
      .where(and(eq(userAlbums.id, userAlbumId), eq(userAlbums.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  async listAlbumsForOwner(userId: string): Promise<UserAlbum[]> {
    return db
      .select()
      .from(userAlbums)
      .where(eq(userAlbums.userId, userId))
      .orderBy(asc(userAlbums.createdAt));
  }

  async listPublishedAlbums(userId: string): Promise<PublishedAlbumListing[]> {
    return db.transaction(async (tx) => {
      const headers = await tx
        .select({
          id: albums.id, title: albums.title, publisher: albums.publisher, year: albums.year,
          coverUrl: albums.coverUrl, status: albums.status,
        })
        .from(albums)
        .where(eq(albums.status, "published"))
        .orderBy(asc(albums.title));
      if (headers.length === 0) return [];
      const albumIds = headers.map((album) => album.id);
      const [totals, memberships] = await Promise.all([
        tx.select({ albumId: stickers.albumId, value: sql<number>`count(*)::int` })
          .from(stickers).where(inArray(stickers.albumId, albumIds)).groupBy(stickers.albumId),
        tx.select({ id: userAlbums.id, albumId: userAlbums.albumId })
          .from(userAlbums)
          .where(and(eq(userAlbums.userId, userId), inArray(userAlbums.albumId, albumIds))),
      ]);
      const totalMap = new Map(totals.map((row) => [row.albumId, row.value]));
      const membershipMap = new Map(memberships.map((row) => [row.albumId, row.id]));
      return headers.map((album) => ({
        ...album,
        stickerCount: totalMap.get(album.id) ?? 0,
        userAlbumId: membershipMap.get(album.id) ?? null,
      }));
    });
  }

  async listAlbumsByOwnerWithProgress(userId: string): Promise<UserAlbumListing[]> {
    return db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(userAlbums)
        .where(eq(userAlbums.userId, userId))
        .orderBy(asc(userAlbums.createdAt));
      return attachProgress(tx, rows);
    });
  }

  async getAlbumDetail(userId: string, userAlbumId: string): Promise<UserAlbumDetail | null> {
    return db.transaction(async (tx) => {
      const ownership = await loadOwnerOrForbid(tx, userAlbumId, userId);
      const header = await loadAlbumHeader(tx, ownership.albumId);
      if (!header) throw new CollectionError("not_found");
      const sections = await tx
        .select({
          id: albumSections.id, name: albumSections.name, position: albumSections.position,
        })
        .from(albumSections)
        .where(eq(albumSections.albumId, ownership.albumId))
        .orderBy(asc(albumSections.position));
      const stickerRows = await tx
        .select({
          id: stickers.id, code: stickers.code, name: stickers.name,
          position: stickers.position, sectionId: stickers.sectionId,
        })
        .from(stickers)
        .where(eq(stickers.albumId, ownership.albumId))
        .orderBy(asc(stickers.position));
      const quantities = await loadQuantitiesForUserAlbum(tx, userAlbumId);
      const total = stickerRows.length;
      const allQuantities = stickerRows.map((sticker) => quantities.get(sticker.id) ?? 0);
      const progress = computeProgress(allQuantities, total);
      const grouped: UserAlbumDetail["sections"] = sections.map((section) => ({
        ...section,
        stickers: stickerRows
          .filter((sticker) => sticker.sectionId === section.id)
          .map((sticker) => ({
            id: sticker.id, code: sticker.code, name: sticker.name, position: sticker.position,
            quantity: quantities.get(sticker.id) ?? 0,
          })),
      }));
      const unassigned = stickerRows
        .filter((sticker) => sticker.sectionId === null)
        .map((sticker) => ({
          id: sticker.id, code: sticker.code, name: sticker.name, position: sticker.position,
          quantity: quantities.get(sticker.id) ?? 0,
        }));
      return {
        ...ownership,
        album: header,
        progress,
        sections: grouped,
        unassigned,
      };
    });
  }

  async removeAlbum(actorId: string, userAlbumId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await lockUserAlbum(tx, userAlbumId);
      const ownership = await loadOwnerOrForbid(tx, userAlbumId, actorId);
      // CASCADE removes progress automatically; the call is explicit here so
      // the intent is obvious to future readers.
      await tx.delete(userAlbumStickers).where(eq(userAlbumStickers.userAlbumId, ownership.id));
      await tx.delete(userAlbums).where(eq(userAlbums.id, ownership.id));
    });
  }

  async findAlbumHeader(albumId: string): Promise<AlbumHeader | null> {
    return db.transaction(async (tx) => loadAlbumHeader(tx, albumId));
  }

  async listQuantities(userId: string, userAlbumId: string): Promise<Map<string, number>> {
    return db.transaction(async (tx) => {
      await loadOwnerOrForbid(tx, userAlbumId, userId);
      return loadQuantitiesForUserAlbum(tx, userAlbumId);
    });
  }

  async adjustQuantity(
    actorId: string,
    userAlbumId: string,
    stickerId: string,
    change: StickerQuantityChange,
    quantity?: number,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await lockUserAlbum(tx, userAlbumId);
      const ownership = await loadOwnerOrForbid(tx, userAlbumId, actorId);
      const [sticker] = await tx
        .select({ id: stickers.id, albumId: stickers.albumId })
        .from(stickers)
        .where(eq(stickers.id, stickerId))
        .limit(1);
      assertStickerBelongsToAlbum(sticker ?? null, ownership.albumId);
      const [current] = await tx
        .select({ quantity: userAlbumStickers.quantity })
        .from(userAlbumStickers)
        .where(and(eq(userAlbumStickers.userAlbumId, ownership.id), eq(userAlbumStickers.stickerId, stickerId)))
        .limit(1);
      const before = current?.quantity ?? 0;
      const target = nextQuantity(before, change, quantity);
      if (target === before) return;
      if (target < 1) {
        if (current) {
          await tx.delete(userAlbumStickers).where(
            and(eq(userAlbumStickers.userAlbumId, ownership.id), eq(userAlbumStickers.stickerId, stickerId)),
          );
        }
        return;
      }
      if (current) {
        await tx.update(userAlbumStickers)
          .set({ quantity: target, updatedAt: new Date() })
          .where(and(eq(userAlbumStickers.userAlbumId, ownership.id), eq(userAlbumStickers.stickerId, stickerId)));
      } else {
        await tx.insert(userAlbumStickers).values({ userAlbumId: ownership.id, stickerId, quantity: target });
      }
    });
  }

  async albumHasCollections(albumId: string): Promise<boolean> {
    const [row] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(userAlbums)
      .where(eq(userAlbums.albumId, albumId));
    return (row?.value ?? 0) > 0;
  }

  async stickerHasProgress(stickerId: string): Promise<boolean> {
    const [row] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(userAlbumStickers)
      .where(eq(userAlbumStickers.stickerId, stickerId));
    return (row?.value ?? 0) > 0;
  }
}

export function nextQuantity(
  current: number,
  change: StickerQuantityChange,
  requested?: number,
): number {
  if (change === "increment") return Math.min(1000, Math.max(0, current + 1));
  if (change === "decrement") return Math.max(0, current - 1);
  if (typeof requested !== "number") return current;
  return Math.max(0, Math.floor(requested));
}
