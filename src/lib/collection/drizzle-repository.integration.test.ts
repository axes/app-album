import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type postgres from "postgres";
import type { DrizzleCatalogRepository } from "@/lib/catalog/drizzle-repository";
import type { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionError } from "@/lib/collection/service";

/**
 * Integration coverage for the real PostgreSQL collection repository.
 *
 * Mirrors the catalog suite: every server-only module is imported dynamically
 * and the suite is skipped without DATABASE_URL. The suite exercises the
 * constraints that the pure unit tests cannot reproduce: the UNIQUE
 * `(user_id, album_id)`, the CHECK `quantity >= 1`, the CASCADE on
 * `user_album → user_album_stickers`, the RESTRICT on master albums and
 * stickers, and the `+1/-1` concurrency under `pg_advisory_xact_lock`.
 */
const url = process.env.DATABASE_URL;
const suite = url ? describe : describe.skip;

suite("drizzle collection repository (integration)", () => {
  let sql: ReturnType<typeof postgres>;
  const stamp = Date.now();
  let catalog: DrizzleCatalogRepository;
  let collections: DrizzleCollectionRepository;
  let adminId = "";
  let userAId = "";
  let userBId = "";
  let publishedAlbumId = "";
  let draftAlbumId = "";
  let otherAlbumId = "";
  let sectionId = "";
  const cleanupAlbumIds: string[] = [];
  const cleanupUserIds: string[] = [];

  async function createUser(role: "admin" | "user", suffix: string) {
    const [user] = await sql`
      insert into users (username, email, email_owner_type, role, status, password_hash)
      values (${suffix}, ${`${suffix}@example.com`}, 'self', ${role}, 'active', 'x')
      returning id`;
    return user.id as string;
  }

  async function createAlbum(title: string, slug: string) {
    return catalog.createAlbum(
      adminId,
      { title, description: null, publisher: null, year: null, coverUrl: null },
      slug,
    );
  }

  beforeAll(async () => {
    const [{ default: createClient }, catalogModule, collectionModule] = await Promise.all([
      import("postgres"),
      import("@/lib/catalog/drizzle-repository"),
      import("@/lib/collection/drizzle-repository"),
    ]);
    sql = createClient(url as string, { max: 1 });
    catalog = new catalogModule.DrizzleCatalogRepository();
    collections = new collectionModule.DrizzleCollectionRepository();

    adminId = await createUser("admin", `it_admin_${stamp}`);
    userAId = await createUser("user", `it_user_a_${stamp}`);
    userBId = await createUser("user", `it_user_b_${stamp}`);
    cleanupUserIds.push(adminId, userAId, userBId);

    publishedAlbumId = await createAlbum("Álbum publicado", `it-album-pub-${stamp}`);
    draftAlbumId = await createAlbum("Álbum borrador", `it-album-draft-${stamp}`);
    otherAlbumId = await createAlbum("Álbum ajeno", `it-album-other-${stamp}`);
    cleanupAlbumIds.push(publishedAlbumId, draftAlbumId, otherAlbumId);

    await catalog.createSections(adminId, publishedAlbumId, ["Página 1"]);
    const detail = await catalog.getAlbum(publishedAlbumId);
    sectionId = detail!.sections[0]!.id;

    await catalog.createStickers(adminId, publishedAlbumId, {
      codes: ["PUB-1"],
      name: null,
      sectionId,
    });
    await catalog.createStickers(adminId, publishedAlbumId, {
      codes: ["PUB-2"],
      name: null,
      sectionId: null,
    });
    await catalog.createStickers(adminId, otherAlbumId, {
      codes: ["OTH-1"],
      name: null,
      sectionId: null,
    });

    await catalog.changeAlbumStatus(adminId, publishedAlbumId, "published");
  });

  beforeEach(async () => {
    await sql`delete from user_albums where user_id = any(${cleanupUserIds}::uuid[])`;
  });

  afterAll(async () => {
    await sql`delete from user_album_stickers where user_album_id in (
      select id from user_albums where album_id = any(${cleanupAlbumIds}::uuid[])
    )`;
    await sql`delete from user_albums where album_id = any(${cleanupAlbumIds}::uuid[])`;
    await sql`delete from stickers where album_id = any(${cleanupAlbumIds}::uuid[])`;
    await sql`delete from album_sections where album_id = any(${cleanupAlbumIds}::uuid[])`;
    await sql`delete from album_admin_events where album_id = any(${cleanupAlbumIds}::uuid[])`;
    await sql`delete from albums where id = any(${cleanupAlbumIds}::uuid[])`;
    await sql`delete from user_admin_events where target_user_id = any(${cleanupUserIds}::uuid[])`;
    await sql`delete from users where id = any(${cleanupUserIds}::uuid[])`;
    await sql.end();
  });

  it("rejects draft albums and refuses duplicates while inserting zero progress rows", async () => {
    await expect(collections.addAlbum(userAId, draftAlbumId)).rejects.toMatchObject({ code: "album_not_published" });
    const first = await collections.addAlbum(userAId, publishedAlbumId);
    await expect(collections.addAlbum(userAId, publishedAlbumId)).rejects.toMatchObject({ code: "duplicate_collection" });
    const [entryCount] = await sql<{ value: number }[]>`
      select count(*)::int as value from user_album_stickers where user_album_id = ${first.id}`;
    expect(entryCount?.value ?? 0).toBe(0);
  });

  it("enforces ownership and treats admin as just another actor", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const stickerRows = await sql<{ id: string }[]>`
      select id from stickers where album_id = ${publishedAlbumId} limit 1`;
    const stickerId = stickerRows[0]!.id as string;
    await expect(collections.adjustQuantity(userBId, collection.id, stickerId, "increment")).rejects.toMatchObject({ code: "forbidden" });
    await expect(collections.adjustQuantity(adminId, collection.id, stickerId, "increment")).rejects.toMatchObject({ code: "forbidden" });
    await expect(collections.removeAlbum(userBId, collection.id)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("rejects stickers that do not belong to the collection album", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const [foreign] = await sql<{ id: string }[]>`select id from stickers where album_id = ${otherAlbumId} limit 1`;
    await expect(collections.adjustQuantity(userAId, collection.id, foreign!.id, "increment")).rejects.toMatchObject({ code: "sticker_not_in_album" });
  });

  it("increments, deletes at zero and never goes negative", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const [sticker] = await sql<{ id: string }[]>`select id from stickers where album_id = ${publishedAlbumId} and code = 'PUB-1'`;
    const stickerId = sticker!.id as string;
    await collections.adjustQuantity(userAId, collection.id, stickerId, "increment");
    await collections.adjustQuantity(userAId, collection.id, stickerId, "increment");
    let [row] = await sql<{ quantity: number }[]>`
      select quantity from user_album_stickers where user_album_id = ${collection.id} and sticker_id = ${stickerId}`;
    expect(row?.quantity).toBe(2);
    await collections.adjustQuantity(userAId, collection.id, stickerId, "decrement");
    await collections.adjustQuantity(userAId, collection.id, stickerId, "decrement");
    [row] = await sql<{ quantity: number }[]>`select quantity from user_album_stickers where user_album_id = ${collection.id} and sticker_id = ${stickerId}`;
    expect(row).toBeUndefined();
    await collections.adjustQuantity(userAId, collection.id, stickerId, "decrement");
    const [neg] = await sql<{ value: number }[]>`select count(*)::int as value from user_album_stickers where user_album_id = ${collection.id} and sticker_id = ${stickerId}`;
    expect(neg?.value ?? 0).toBe(0);
  });

  it("survives concurrent increments without losing updates", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const [sticker] = await sql<{ id: string }[]>`select id from stickers where album_id = ${publishedAlbumId} and code = 'PUB-2'`;
    const stickerId = sticker!.id as string;
    const total = 25;
    await Promise.all(
      Array.from({ length: total }, () => collections.adjustQuantity(userAId, collection.id, stickerId, "increment")),
    );
    const [row] = await sql<{ quantity: number }[]>`
      select quantity from user_album_stickers where user_album_id = ${collection.id} and sticker_id = ${stickerId}`;
    expect(row?.quantity).toBe(total);
  });

  it("removing a collection cascades its progress", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const [sticker] = await sql<{ id: string }[]>`select id from stickers where album_id = ${publishedAlbumId} and code = 'PUB-1'`;
    await collections.adjustQuantity(userAId, collection.id, sticker!.id, "increment");
    await collections.removeAlbum(userAId, collection.id);
    const [rows] = await sql<{ value: number }[]>`select count(*)::int as value from user_album_stickers where user_album_id = ${collection.id}`;
    expect(rows?.value ?? 0).toBe(0);
    const [owner] = await sql<{ value: number }[]>`select count(*)::int as value from user_albums where id = ${collection.id}`;
    expect(owner?.value ?? 0).toBe(0);
  });

  it("blocks master deletion when a collection exists and progress is referenced", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const [sticker] = await sql<{ id: string }[]>`select id from stickers where album_id = ${publishedAlbumId} limit 1`;
    await collections.adjustQuantity(userAId, collection.id, sticker!.id, "increment");

    await expect(catalog.deleteAlbum(adminId, publishedAlbumId)).rejects.toMatchObject({ code: "album_has_collections" });
    await expect(catalog.deleteSticker(adminId, publishedAlbumId, sticker!.id)).rejects.toMatchObject({ code: "sticker_has_progress" });
  });

  it("lists published albums with sticker totals and membership without duplicates", async () => {
    const membership = await collections.addAlbum(userAId, publishedAlbumId);
    const listing = await collections.listPublishedAlbums(userAId);
    const published = listing.find((album) => album.id === publishedAlbumId);

    expect(published).toMatchObject({ stickerCount: 2, userAlbumId: membership.id });
    expect(listing.some((album) => album.id === draftAlbumId)).toBe(false);
    expect(listing.filter((album) => album.id === publishedAlbumId)).toHaveLength(1);

    const otherUserListing = await collections.listPublishedAlbums(userBId);
    expect(otherUserListing.find((album) => album.id === publishedAlbumId)?.userAlbumId).toBeNull();
  });

  it("aggregates progress across multiple collections without cartesian multiplication", async () => {
    await catalog.createSections(adminId, otherAlbumId, ["Página A", "Página B"]);
    const otherDetail = await catalog.getAlbum(otherAlbumId);
    await catalog.createStickers(adminId, otherAlbumId, {
      codes: ["OTH-2", "OTH-3"], name: null, sectionId: otherDetail!.sections[0]!.id,
    });
    await catalog.changeAlbumStatus(adminId, otherAlbumId, "published");
    const first = await collections.addAlbum(userAId, publishedAlbumId);
    const second = await collections.addAlbum(userAId, otherAlbumId);
    const [firstSticker] = await sql<{ id: string }[]>`select id from stickers where album_id = ${publishedAlbumId} order by position limit 1`;
    const [secondSticker] = await sql<{ id: string }[]>`select id from stickers where album_id = ${otherAlbumId} order by position limit 1`;
    await collections.adjustQuantity(userAId, first.id, firstSticker!.id, "increment");
    await collections.adjustQuantity(userAId, second.id, secondSticker!.id, "increment");
    await collections.adjustQuantity(userAId, second.id, secondSticker!.id, "increment");

    const rows = await collections.listAlbumsByOwnerWithProgress(userAId);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === first.id)?.progress).toMatchObject({ total: 2, owned: 1, duplicates: 0 });
    expect(rows.find((row) => row.id === second.id)?.progress).toMatchObject({ total: 3, owned: 1, duplicates: 1 });
    await catalog.changeAlbumStatus(adminId, otherAlbumId, "draft");
  });

  it("returns a useful detail listing for the owner only", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const [sticker] = await sql<{ id: string }[]>`select id from stickers where album_id = ${publishedAlbumId} and code = 'PUB-1'`;
    await collections.adjustQuantity(userAId, collection.id, sticker!.id, "increment");

    const detail = await collections.getAlbumDetail(userAId, collection.id);
    expect(detail?.album.id).toBe(publishedAlbumId);
    expect(detail?.progress.owned).toBe(1);
    expect(detail?.sections).toHaveLength(1);
    expect(detail?.sections[0]?.stickers.some((entry) => entry.quantity === 1)).toBe(true);
    expect(detail?.unassigned.length).toBe(1);

    await expect(collections.getAlbumDetail(userBId, collection.id)).rejects.toBeInstanceOf(CollectionError);
  });
});
