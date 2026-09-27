import "server-only";
import { and, asc, count, desc, eq, inArray, max, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  albumAdminEvents,
  albums,
  albumSections,
  stickers,
  userAlbumStickers,
  userAlbums,
  users,
} from "@/lib/db/schema";
import {
  CatalogError,
  type AlbumDetail,
  type AlbumInput,
  type AlbumSummary,
  type CatalogRepository,
  type Direction,
  type StickerBulkInput,
  resolveUniqueSlug,
} from "./service";
import {
  assertCanDeleteAlbum,
  assertCanPublish,
  assertSectionBelongsToAlbum,
  auditActionForStatus,
} from "./rules";
import { assertActiveAdmin } from "./authorization";
import { deletePageWithDetachedStickers, type PageDeletionPort } from "./page-deletion";

function isUnique(error: unknown, constraint: string) {
  return typeof error === "object" && error !== null &&
    (error as { code?: unknown }).code === "23505" &&
    (error as { constraint_name?: unknown }).constraint_name === constraint;
}

async function assertAdmin(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], actorId: string) {
  const [actor] = await tx.select({ role: users.role, status: users.status })
    .from(users).where(eq(users.id, actorId)).limit(1);
  assertActiveAdmin(actor ?? null);
}

async function lockAlbum(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], albumId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${albumId}))`);
}

/**
 * Shifts every position above `removedPosition` down by one.
 *
 * A single `position - 1` statement is NOT safe: PostgreSQL updates rows in an
 * arbitrary order, so shifting `3 -> 2` before `2 -> 1` violates the unique
 * `(album_id, position)` index. The shift is therefore done in two phases
 * through a temporary offset that cannot collide with real positions.
 */
const POSITION_OFFSET = 1_000_000;

async function compactPositions(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  albumId: string,
  removedPosition: number,
) {
  await tx.update(albumSections)
    .set({ position: sql`${albumSections.position} + ${POSITION_OFFSET}` })
    .where(and(
      eq(albumSections.albumId, albumId),
      sql`${albumSections.position} > ${removedPosition}`,
    ));
  await tx.update(albumSections)
    .set({ position: sql`${albumSections.position} - ${POSITION_OFFSET + 1}` })
    .where(and(
      eq(albumSections.albumId, albumId),
      sql`${albumSections.position} > ${POSITION_OFFSET + removedPosition}`,
    ));
}

export class DrizzleCatalogRepository implements CatalogRepository {
  async listAlbums(): Promise<AlbumSummary[]> {
    // Aggregate each child table independently before joining. This keeps the
    // listing to one query without multiplying pages × stickers × collections
    // for an album. Each subquery is grouped by album_id so the final LEFT JOIN
    // produces exactly one row per album.
    const sectionCounts = db
      .select({
        albumId: albumSections.albumId,
        value: count(albumSections.id).as("section_count"),
      })
      .from(albumSections)
      .groupBy(albumSections.albumId)
      .as("section_counts");
    const stickerCounts = db
      .select({
        albumId: stickers.albumId,
        value: count(stickers.id).as("sticker_count"),
      })
      .from(stickers)
      .groupBy(stickers.albumId)
      .as("sticker_counts");
    const collectionCounts = db
      .select({
        albumId: userAlbums.albumId,
        value: count(userAlbums.id).as("collection_count"),
      })
      .from(userAlbums)
      .groupBy(userAlbums.albumId)
      .as("collection_counts");

    const rows = await db
      .select({
        id: albums.id, slug: albums.slug, title: albums.title,
        description: albums.description, publisher: albums.publisher, year: albums.year,
        coverUrl: albums.coverUrl, status: albums.status,
        sectionCount: sql<number>`coalesce(${sectionCounts.value}, 0)::int`,
        stickerCount: sql<number>`coalesce(${stickerCounts.value}, 0)::int`,
        collectionCount: sql<number>`coalesce(${collectionCounts.value}, 0)::int`,
      })
      .from(albums)
      .leftJoin(sectionCounts, eq(sectionCounts.albumId, albums.id))
      .leftJoin(stickerCounts, eq(stickerCounts.albumId, albums.id))
      .leftJoin(collectionCounts, eq(collectionCounts.albumId, albums.id))
      .orderBy(asc(albums.title));
    return rows;
  }

  async getAlbum(id: string): Promise<AlbumDetail | null> {
    const [album] = await db
      .select({
        id: albums.id, slug: albums.slug, title: albums.title,
        description: albums.description, publisher: albums.publisher, year: albums.year,
        coverUrl: albums.coverUrl, status: albums.status,
        sectionCount: sql<number>`(select count(*)::int from album_sections s where s.album_id = ${id})`,
        stickerCount: sql<number>`(select count(*)::int from stickers st where st.album_id = ${id})`,
        collectionCount: sql<number>`(select count(*)::int from user_albums ua where ua.album_id = ${id})`,
      })
      .from(albums).where(eq(albums.id, id)).limit(1);
    if (!album) return null;
    const sections = await db.select({ id: albumSections.id, albumId: albumSections.albumId, name: albumSections.name, position: albumSections.position })
      .from(albumSections).where(eq(albumSections.albumId, id)).orderBy(asc(albumSections.position));
    const stickerRows = await db.select({ id: stickers.id, albumId: stickers.albumId, sectionId: stickers.sectionId, code: stickers.code, name: stickers.name, position: stickers.position })
      .from(stickers).where(eq(stickers.albumId, id)).orderBy(asc(stickers.position));
    return { ...album, sections, stickers: stickerRows };
  }

  async createAlbum(actorId: string, input: AlbumInput, slugBase: string): Promise<string> {
    return db.transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      await tx.execute(sql`select pg_advisory_xact_lock(741904)`);
      const slug = await resolveUniqueSlug(slugBase, async (candidate) => {
        const [existing] = await tx.select({ id: albums.id }).from(albums)
          .where(eq(albums.slug, candidate)).limit(1);
        return Boolean(existing);
      });
      const [album] = await tx.insert(albums).values({ ...input, slug, createdBy: actorId }).returning({ id: albums.id, title: albums.title });
      if (!album) throw new Error("Album insert failed");
      await tx.insert(albumAdminEvents).values({ actorUserId: actorId, albumId: album.id, albumTitle: album.title, action: "create" });
      return album.id;
    });
  }

  async updateAlbum(actorId: string, albumId: string, input: AlbumInput): Promise<void> {
    await db.transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      const rows = await tx.update(albums).set({ ...input, updatedAt: new Date() })
        .where(eq(albums.id, albumId)).returning({ id: albums.id });
      if (!rows[0]) throw new CatalogError("not_found");
    });
  }

  async changeAlbumStatus(actorId: string, albumId: string, status: "draft" | "published"): Promise<void> {
    await db.transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      await lockAlbum(tx, albumId);
      const [album] = await tx.select().from(albums).where(eq(albums.id, albumId)).limit(1);
      if (!album) throw new CatalogError("not_found");
      if (album.status === status) return;
      if (status === "published") {
        const [[sectionTotal], [stickerTotal]] = await Promise.all([
          tx.select({ value: count() }).from(albumSections).where(eq(albumSections.albumId, albumId)),
          tx.select({ value: count() }).from(stickers).where(eq(stickers.albumId, albumId)),
        ]);
        assertCanPublish(album.title, sectionTotal?.value ?? 0, stickerTotal?.value ?? 0);
      }
      await tx.update(albums).set({ status, updatedAt: new Date() }).where(eq(albums.id, albumId));
      await tx.insert(albumAdminEvents).values({
        actorUserId: actorId, albumId, albumTitle: album.title,
        action: auditActionForStatus(status),
      });
    });
  }

  async deleteAlbum(actorId: string, albumId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      await lockAlbum(tx, albumId);
      const [album] = await tx.select().from(albums).where(eq(albums.id, albumId)).limit(1);
      if (!album) throw new CatalogError("not_found");
      const [[sections], [stickerTotal], [collectionTotal]] = await Promise.all([
        tx.select({ value: count() }).from(albumSections).where(eq(albumSections.albumId, albumId)),
        tx.select({ value: count() }).from(stickers).where(eq(stickers.albumId, albumId)),
        tx.select({ value: count() }).from(userAlbums).where(eq(userAlbums.albumId, albumId)),
      ]);
      assertCanDeleteAlbum(
        album.status,
        sections?.value ?? 0,
        stickerTotal?.value ?? 0,
        collectionTotal?.value ?? 0,
      );
      await tx.insert(albumAdminEvents).values({ actorUserId: actorId, albumId, albumTitle: album.title, action: "delete" });
      await tx.delete(albums).where(eq(albums.id, albumId));
    });
  }

  async createSection(actorId: string, albumId: string, name: string): Promise<void> {
    await db.transaction(async (tx) => {
      await assertAdmin(tx, actorId); await lockAlbum(tx, albumId);
      const [album] = await tx.select({ id: albums.id }).from(albums).where(eq(albums.id, albumId)).limit(1);
      if (!album) throw new CatalogError("not_found");
      const [last] = await tx.select({ value: max(albumSections.position) }).from(albumSections).where(eq(albumSections.albumId, albumId));
      await tx.insert(albumSections).values({ albumId, name, position: (last?.value ?? 0) + 1 });
    });
  }

  async renameSection(actorId: string, albumId: string, sectionId: string, name: string): Promise<void> {
    await db.transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      const rows = await tx.update(albumSections).set({ name, updatedAt: new Date() })
        .where(and(eq(albumSections.id, sectionId), eq(albumSections.albumId, albumId))).returning({ id: albumSections.id });
      if (!rows[0]) throw new CatalogError("not_found");
    });
  }

  async moveSection(actorId: string, albumId: string, sectionId: string, direction: Direction): Promise<void> {
    await db.transaction(async (tx) => {
      await assertAdmin(tx, actorId); await lockAlbum(tx, albumId);
      const [current] = await tx.select().from(albumSections).where(and(eq(albumSections.id, sectionId), eq(albumSections.albumId, albumId))).limit(1);
      if (!current) throw new CatalogError("not_found");
      const comparison = direction === "up" ? sql`${albumSections.position} < ${current.position}` : sql`${albumSections.position} > ${current.position}`;
      const [other] = await tx.select().from(albumSections).where(and(eq(albumSections.albumId, albumId), comparison))
        .orderBy(direction === "up" ? desc(albumSections.position) : asc(albumSections.position)).limit(1);
      if (!other) return;
      await tx.update(albumSections).set({ position: 0 }).where(eq(albumSections.id, current.id));
      await tx.update(albumSections).set({ position: current.position }).where(eq(albumSections.id, other.id));
      await tx.update(albumSections).set({ position: other.position }).where(eq(albumSections.id, current.id));
    });
  }

  async deleteSection(actorId: string, albumId: string, sectionId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await assertAdmin(tx, actorId); await lockAlbum(tx, albumId);
      // Stickers are never deleted with their page: they are detached to
      // `section_id = null` ("Sin página asignada") inside the same transaction.
      const port: PageDeletionPort = {
        async findPage(album, page) {
          const [row] = await tx.select({ id: albumSections.id, position: albumSections.position })
            .from(albumSections)
            .where(and(eq(albumSections.id, page), eq(albumSections.albumId, album)))
            .limit(1);
          return row ?? null;
        },
        async detachStickers(album, page) {
          const rows = await tx.update(stickers)
            .set({ sectionId: null, updatedAt: new Date() })
            .where(and(eq(stickers.albumId, album), eq(stickers.sectionId, page)))
            .returning({ id: stickers.id });
          return rows.length;
        },
        async removePage(page) {
          await tx.delete(albumSections).where(eq(albumSections.id, page));
        },
        async compactPositions(album, removedPosition) {
          await compactPositions(tx, album, removedPosition);
        },
      };
      await deletePageWithDetachedStickers(port, albumId, sectionId);
    });
  }

  async createSticker(actorId: string, albumId: string, input: { code: string; name: string | null; sectionId: string | null }): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await assertAdmin(tx, actorId); await lockAlbum(tx, albumId);
        if (input.sectionId) {
          const [section] = await tx.select({ id: albumSections.id }).from(albumSections)
            .where(and(eq(albumSections.id, input.sectionId), eq(albumSections.albumId, albumId))).limit(1);
          assertSectionBelongsToAlbum(section ? albumId : null, albumId);
        }
        const [album] = await tx.select({ id: albums.id }).from(albums).where(eq(albums.id, albumId)).limit(1);
        if (!album) throw new CatalogError("not_found");
        const [last] = await tx.select({ value: max(stickers.position) }).from(stickers).where(eq(stickers.albumId, albumId));
        await tx.insert(stickers).values({ albumId, ...input, position: (last?.value ?? 0) + 1 });
      });
    } catch (error) {
      if (isUnique(error, "stickers_album_code_unique")) throw new CatalogError("duplicate_code");
      throw error;
    }
  }

  async createStickers(actorId: string, albumId: string, input: StickerBulkInput): Promise<number> {
    try {
      return await db.transaction(async (tx) => {
        await assertAdmin(tx, actorId);
        await lockAlbum(tx, albumId);
        const [album] = await tx.select({ id: albums.id }).from(albums)
          .where(eq(albums.id, albumId)).limit(1);
        if (!album) throw new CatalogError("not_found");
        if (input.sectionId) {
          const [section] = await tx.select({ id: albumSections.id }).from(albumSections)
            .where(and(eq(albumSections.id, input.sectionId), eq(albumSections.albumId, albumId)))
            .limit(1);
          assertSectionBelongsToAlbum(section ? albumId : null, albumId);
        }
        // Validate the whole batch against existing codes before inserting so a
        // conflict can never leave a partially created batch behind.
        const existing = await tx.select({ code: stickers.code }).from(stickers)
          .where(and(eq(stickers.albumId, albumId), inArray(stickers.code, input.codes)));
        if (existing.length > 0) throw new CatalogError("duplicate_code");
        const [last] = await tx.select({ value: max(stickers.position) }).from(stickers)
          .where(eq(stickers.albumId, albumId));
        const base = last?.value ?? 0;
        await tx.insert(stickers).values(
          input.codes.map((code, index) => ({
            albumId,
            sectionId: input.sectionId,
            code,
            name: input.name,
            position: base + index + 1,
          })),
        );
        return input.codes.length;
      });
    } catch (error) {
      if (isUnique(error, "stickers_album_code_unique")) throw new CatalogError("duplicate_code");
      throw error;
    }
  }

  async createSections(actorId: string, albumId: string, names: string[]): Promise<number> {
    return db.transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      await lockAlbum(tx, albumId);
      const [album] = await tx.select({ id: albums.id }).from(albums)
        .where(eq(albums.id, albumId)).limit(1);
      if (!album) throw new CatalogError("not_found");
      const [last] = await tx.select({ value: max(albumSections.position) }).from(albumSections)
        .where(eq(albumSections.albumId, albumId));
      const base = last?.value ?? 0;
      await tx.insert(albumSections).values(
        names.map((name, index) => ({ albumId, name, position: base + index + 1 })),
      );
      return names.length;
    });
  }

  async updateSticker(actorId: string, albumId: string, stickerId: string, input: { code: string; name: string | null; sectionId: string | null }): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await assertAdmin(tx, actorId);
        if (input.sectionId) {
          const [section] = await tx.select({ id: albumSections.id }).from(albumSections)
            .where(and(eq(albumSections.id, input.sectionId), eq(albumSections.albumId, albumId))).limit(1);
          assertSectionBelongsToAlbum(section ? albumId : null, albumId);
        }
        const rows = await tx.update(stickers).set({ ...input, updatedAt: new Date() })
          .where(and(eq(stickers.id, stickerId), eq(stickers.albumId, albumId))).returning({ id: stickers.id });
        if (!rows[0]) throw new CatalogError("not_found");
      });
    } catch (error) {
      if (isUnique(error, "stickers_album_code_unique")) throw new CatalogError("duplicate_code");
      throw error;
    }
  }

  async moveSticker(actorId: string, albumId: string, stickerId: string, direction: Direction): Promise<void> {
    await db.transaction(async (tx) => {
      await assertAdmin(tx, actorId); await lockAlbum(tx, albumId);
      const [current] = await tx.select().from(stickers).where(and(eq(stickers.id, stickerId), eq(stickers.albumId, albumId))).limit(1);
      if (!current) throw new CatalogError("not_found");
      const comparison = direction === "up" ? sql`${stickers.position} < ${current.position}` : sql`${stickers.position} > ${current.position}`;
      const [other] = await tx.select().from(stickers).where(and(eq(stickers.albumId, albumId), comparison))
        .orderBy(direction === "up" ? desc(stickers.position) : asc(stickers.position)).limit(1);
      if (!other) return;
      await tx.update(stickers).set({ position: 0 }).where(eq(stickers.id, current.id));
      await tx.update(stickers).set({ position: current.position }).where(eq(stickers.id, other.id));
      await tx.update(stickers).set({ position: other.position }).where(eq(stickers.id, current.id));
    });
  }

  async deleteSticker(actorId: string, albumId: string, stickerId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await assertAdmin(tx, actorId); await lockAlbum(tx, albumId);
      // A sticker referenced by any collector's progress must never be deleted
      // silently: the FK is RESTRICT, and this check turns the raw 23503 into a
      // domain error the admin UI can explain.
      const [progress] = await tx.select({ value: count() }).from(userAlbumStickers)
        .where(eq(userAlbumStickers.stickerId, stickerId));
      if ((progress?.value ?? 0) > 0) throw new CatalogError("sticker_has_progress");
      const [sticker] = await tx.delete(stickers).where(and(eq(stickers.id, stickerId), eq(stickers.albumId, albumId))).returning({ position: stickers.position });
      if (!sticker) throw new CatalogError("not_found");
      // Same two-phase shift as pages: a plain `position - 1` can collide with
      // the unique `(album_id, position)` index.
      await tx.update(stickers)
        .set({ position: sql`${stickers.position} + ${POSITION_OFFSET}` })
        .where(and(eq(stickers.albumId, albumId), sql`${stickers.position} > ${sticker.position}`));
      await tx.update(stickers)
        .set({ position: sql`${stickers.position} - ${POSITION_OFFSET + 1}` })
        .where(and(eq(stickers.albumId, albumId), sql`${stickers.position} > ${POSITION_OFFSET + sticker.position}`));
    });
  }

  async bulkAssignStickerSection(
    actorId: string,
    albumId: string,
    stickerIds: string[],
    sectionId: string | null,
  ): Promise<number> {
    return db.transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      await lockAlbum(tx, albumId);
      const [album] = await tx.select({ id: albums.id }).from(albums)
        .where(eq(albums.id, albumId)).limit(1);
      if (!album) throw new CatalogError("not_found");
      if (sectionId !== null) {
        const [section] = await tx.select({ id: albumSections.id }).from(albumSections)
          .where(and(eq(albumSections.id, sectionId), eq(albumSections.albumId, albumId)))
          .limit(1);
        assertSectionBelongsToAlbum(section ? albumId : null, albumId);
      }
      // Verify ownership of every sticker before mutating: the count must match
      // the request length or the operation is aborted wholesale.
      const owned = await tx.select({ id: stickers.id })
        .from(stickers)
        .where(and(eq(stickers.albumId, albumId), inArray(stickers.id, stickerIds)));
      if (owned.length !== stickerIds.length) throw new CatalogError("not_found");
      const result = await tx.update(stickers)
        .set({ sectionId, updatedAt: new Date() })
        .where(and(eq(stickers.albumId, albumId), inArray(stickers.id, stickerIds)))
        .returning({ id: stickers.id });
      return result.length;
    });
  }

  async bulkDeleteStickers(
    actorId: string,
    albumId: string,
    stickerIds: string[],
  ): Promise<number> {
    return db.transaction(async (tx) => {
      await assertAdmin(tx, actorId);
      await lockAlbum(tx, albumId);
      const owned = await tx.select({ id: stickers.id })
        .from(stickers)
        .where(and(eq(stickers.albumId, albumId), inArray(stickers.id, stickerIds)));
      if (owned.length !== stickerIds.length) throw new CatalogError("not_found");
      // Any progress anywhere in the batch kills the entire batch.
      const [progress] = await tx.select({ value: count() }).from(userAlbumStickers)
        .where(inArray(userAlbumStickers.stickerId, stickerIds));
      if ((progress?.value ?? 0) > 0) throw new CatalogError("sticker_has_progress");
      await tx.delete(stickers)
        .where(and(eq(stickers.albumId, albumId), inArray(stickers.id, stickerIds)));
      // Normalize positions deterministically. Two phases avoids the unique
      // `(album_id, position)` index collision: phase 1 moves every remaining
      // row into a disjoint high range, phase 2 rewrites them to a contiguous
      // 1..N range. The OFFSET is large enough to never collide with real
      // positions even on a long-lived album.
      const surviving = await tx.select({ id: stickers.id })
        .from(stickers)
        .where(eq(stickers.albumId, albumId))
        .orderBy(asc(stickers.position));
      let slot = 0;
      for (const row of surviving) {
        slot += 1;
        await tx.update(stickers)
          .set({ position: POSITION_OFFSET + slot })
          .where(eq(stickers.id, row.id));
      }
      slot = 0;
      for (const row of surviving) {
        slot += 1;
        await tx.update(stickers)
          .set({ position: slot })
          .where(eq(stickers.id, row.id));
      }
      return stickerIds.length;
    });
  }
}
