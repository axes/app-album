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
  let createClient: typeof postgres;
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

  /**
   * Advisory-lock key the collection repository uses for a `user_albums` row.
   * Kept in sync with `lockUserAlbum` in `src/lib/collection/drizzle-repository.ts`.
   */
  function advisoryKey(userAlbumId: string) {
    return `collection:user-album:${userAlbumId}`;
  }

  /**
   * Observable barrier: resolves once some backend is actually blocked on the
   * collection advisory lock. Without it a concurrency test could pass while
   * never reaching the window it claims to cover.
   */
  async function waitForAdvisoryWait(key: string, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const [row] = await sql<{ value: number }[]>`
        select count(*)::int as value from pg_locks
        where locktype = 'advisory' and not granted
          and classid = ((hashtext(${key})::bigint >> 32) & 4294967295)
          and objid = (hashtext(${key})::bigint & 4294967295)`;
      if ((row?.value ?? 0) > 0) return true;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return false;
  }

  beforeAll(async () => {
    const [{ default: postgresClient }, catalogModule, collectionModule] = await Promise.all([
      import("postgres"),
      import("@/lib/catalog/drizzle-repository"),
      import("@/lib/collection/drizzle-repository"),
    ]);
    createClient = postgresClient;
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
    expect(detail?.sharing).toEqual({ enabled: false, token: null });

    await expect(collections.getAlbumDetail(userBId, collection.id)).rejects.toBeInstanceOf(CollectionError);
  });

  it("enables, disables and reactivates sharing while keeping the token", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const first = await collections.enableSharing(userAId, collection.id, "a".repeat(43));
    expect(first).toEqual({ status: "enabled", token: "a".repeat(43) });

    const detail = await collections.getAlbumDetail(userAId, collection.id);
    expect(detail?.sharing).toEqual({ enabled: true, token: "a".repeat(43) });

    await collections.disableSharing(userAId, collection.id);
    const disabled = await collections.getAlbumDetail(userAId, collection.id);
    expect(disabled?.sharing).toEqual({ enabled: false, token: "a".repeat(43) });

    // Reactivation reuses the stored token even when a new candidate is offered.
    const reactivated = await collections.enableSharing(userAId, collection.id, "b".repeat(43));
    expect(reactivated).toEqual({ status: "enabled", token: "a".repeat(43) });
  });

  it("rejects non-owners on enable and disable", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    await expect(collections.enableSharing(userBId, collection.id, "c".repeat(43))).rejects.toMatchObject({ code: "forbidden" });
    await expect(collections.enableSharing(adminId, collection.id, "c".repeat(43))).rejects.toMatchObject({ code: "forbidden" });
    await expect(collections.disableSharing(userBId, collection.id)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("enforces the share_token UNIQUE constraint as a collision", async () => {
    const first = await collections.addAlbum(userAId, publishedAlbumId);
    const second = await collections.addAlbum(userBId, publishedAlbumId);
    const token = "d".repeat(43);
    await expect(collections.enableSharing(userAId, first.id, token)).resolves.toEqual({ status: "enabled", token });
    await expect(collections.enableSharing(userBId, second.id, token)).resolves.toEqual({ status: "collision" });
    const [row] = await sql<{ sharing_enabled: boolean }[]>`
      select sharing_enabled from user_albums where id = ${second.id}`;
    expect(row?.sharing_enabled).toBe(false);
  });

  it("serves the public view only while enabled and never leaks internal ids", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const [sticker] = await sql<{ id: string }[]>`select id from stickers where album_id = ${publishedAlbumId} and code = 'PUB-1'`;
    await collections.adjustQuantity(userAId, collection.id, sticker!.id, "increment");
    await collections.adjustQuantity(userAId, collection.id, sticker!.id, "increment");
    const token = "e".repeat(43);
    await collections.enableSharing(userAId, collection.id, token);

    const view = await collections.getPublicAlbumByToken(token);
    expect(view?.album.title).toBe("Álbum publicado");
    expect(view?.progress).toMatchObject({ total: 2, owned: 1, missing: 1, duplicates: 1 });
    expect(view?.missing).toEqual([{ name: "Sin página asignada", stickers: [{ code: "PUB-2", name: null }] }]);
    expect(view?.duplicates).toEqual([{ name: "Página 1", stickers: [{ code: "PUB-1", name: null, duplicates: 1 }] }]);
    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain(collection.id);
    expect(serialized).not.toContain(publishedAlbumId);
    expect(serialized).not.toContain(userAId);
    expect(serialized).not.toContain(sticker!.id);

    await collections.disableSharing(userAId, collection.id);
    await expect(collections.getPublicAlbumByToken(token)).resolves.toBeNull();
  });

  it("returns null for unknown tokens and after the collection is deleted", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const token = "f".repeat(43);
    await collections.enableSharing(userAId, collection.id, token);
    await expect(collections.getPublicAlbumByToken("g".repeat(43))).resolves.toBeNull();
    await collections.removeAlbum(userAId, collection.id);
    await expect(collections.getPublicAlbumByToken(token)).resolves.toBeNull();
  });

  /**
   * Coordinated concurrency coverage for the public lookup.
   *
   * The repository serializes `getPublicAlbumByToken`, `enableSharing`,
   * `disableSharing` and `removeAlbum` on the same per-collection advisory
   * lock. These tests hold that lock from an independent connection so the
   * lookup is forced to stop right after its provisional read, then let the
   * revocation win the lock and commit. The lookup under test is always the
   * real repository method; the blocker only replays the exact lock + mutation
   * sequence that `disableSharing` / `removeAlbum` perform, because those
   * methods share the single-connection client the blocked lookup is holding.
   */
  it("serializes the public lookup against a concurrent disable", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const token = "h".repeat(43);
    await collections.enableSharing(userAId, collection.id, token);

    const blocker = createClient(url as string, { max: 1 });
    const key = advisoryKey(collection.id);
    let committed = false;
    try {
      await blocker`begin`;
      await blocker`select pg_advisory_xact_lock(hashtext(${key}))`;

      const lookup = collections.getPublicAlbumByToken(token);
      // The lookup already read the enabled token and is now waiting on the lock.
      expect(await waitForAdvisoryWait(key)).toBe(true);

      // Revocation wins the lock: exactly what `disableSharing` commits.
      await blocker`update user_albums set sharing_enabled = false where id = ${collection.id}`;
      await blocker`commit`;
      committed = true;

      // The post-lock re-read must observe the revocation and serve nothing.
      await expect(lookup).resolves.toBeNull();

      // The replayed mutation left the real domain state consistent.
      const detail = await collections.getAlbumDetail(userAId, collection.id);
      expect(detail?.sharing).toEqual({ enabled: false, token });
    } finally {
      if (!committed) {
        try {
          await blocker`rollback`;
        } catch {
          // The blocker connection is discarded below regardless.
        }
      }
      await blocker.end();
    }
  });

  it("serializes the public lookup against a concurrent delete", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const token = "i".repeat(43);
    await collections.enableSharing(userAId, collection.id, token);

    const blocker = createClient(url as string, { max: 1 });
    const key = advisoryKey(collection.id);
    let committed = false;
    try {
      await blocker`begin`;
      await blocker`select pg_advisory_xact_lock(hashtext(${key}))`;

      const lookup = collections.getPublicAlbumByToken(token);
      expect(await waitForAdvisoryWait(key)).toBe(true);

      // Deletion wins the lock: exactly what `removeAlbum` commits.
      await blocker`delete from user_albums where id = ${collection.id}`;
      await blocker`commit`;
      committed = true;

      await expect(lookup).resolves.toBeNull();
      const [row] = await sql<{ value: number }[]>`
        select count(*)::int as value from user_albums where id = ${collection.id}`;
      expect(row?.value ?? 0).toBe(0);
    } finally {
      if (!committed) {
        try {
          await blocker`rollback`;
        } catch {
          // The blocker connection is discarded below regardless.
        }
      }
      await blocker.end();
    }
  });

  it("waits for the lock and still serves the view when nothing is revoked", async () => {
    const collection = await collections.addAlbum(userAId, publishedAlbumId);
    const token = "j".repeat(43);
    await collections.enableSharing(userAId, collection.id, token);

    const blocker = createClient(url as string, { max: 1 });
    const key = advisoryKey(collection.id);
    let committed = false;
    try {
      await blocker`begin`;
      await blocker`select pg_advisory_xact_lock(hashtext(${key}))`;

      const lookup = collections.getPublicAlbumByToken(token);
      expect(await waitForAdvisoryWait(key)).toBe(true);

      // The concurrent transaction commits without revoking anything.
      await blocker`commit`;
      committed = true;

      const view = await lookup;
      expect(view?.album.title).toBe("Álbum publicado");
      expect(view?.progress.total).toBe(2);
    } finally {
      if (!committed) {
        try {
          await blocker`rollback`;
        } catch {
          // The blocker connection is discarded below regardless.
        }
      }
      await blocker.end();
    }
  });
});
