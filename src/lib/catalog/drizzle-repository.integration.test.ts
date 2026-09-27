import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type postgres from "postgres";
import type { DrizzleCatalogRepository } from "./drizzle-repository";

/**
 * Integration coverage for the real PostgreSQL repository.
 *
 * The unique `(album_id, position)` index is what made page deletion fail, and
 * that behaviour cannot be reproduced with an in-memory adapter. The suite is
 * skipped unless DATABASE_URL points at a disposable local database, and every
 * server-only module is imported dynamically so the default unit run never
 * touches the database client.
 */
const url = process.env.DATABASE_URL;
const suite = url ? describe : describe.skip;

suite("drizzle catalog repository (integration)", () => {
  let sql: ReturnType<typeof postgres>;
  const stamp = Date.now();
  let repository: DrizzleCatalogRepository;
  let adminId = "";
  let albumId = "";
  const summaryAlbumIds: string[] = [];

  beforeAll(async () => {
    const [{ default: createClient }, module] = await Promise.all([
      import("postgres"),
      import("./drizzle-repository"),
    ]);
    sql = createClient(url as string, { max: 1 });
    repository = new module.DrizzleCatalogRepository();
    const [admin] = await sql`
      insert into users (username, email, email_owner_type, role, status, password_hash)
      values (${`it_admin_${stamp}`}, ${`it_admin_${stamp}@example.com`}, 'self', 'admin', 'active', 'x')
      returning id`;
    adminId = admin.id;
    albumId = await repository.createAlbum(
      adminId,
      { title: "Integración", description: null, publisher: null, year: null, coverUrl: null },
      `integracion-${stamp}`,
    );
  });

  afterAll(async () => {
    const allAlbumIds = [albumId, ...summaryAlbumIds];
    await sql`delete from stickers where album_id = any(${allAlbumIds}::uuid[])`;
    await sql`delete from album_sections where album_id = any(${allAlbumIds}::uuid[])`;
    await sql`delete from album_admin_events where album_id = any(${allAlbumIds}::uuid[])`;
    await sql`delete from albums where id = any(${allAlbumIds}::uuid[])`;
    await sql`delete from user_admin_events where target_user_id = ${adminId}`;
    await sql`delete from users where id = ${adminId}`;
    await sql.end();
  });

  it("deletes an empty page created by range and compacts the rest", async () => {
    await repository.createSections(
      adminId,
      albumId,
      Array.from({ length: 20 }, (_, index) => `Página ${index + 1}`),
    );
    const before = await repository.getAlbum(albumId);
    expect(before?.sections).toHaveLength(20);

    // Deleting the first page used to raise 23505 on
    // album_sections_album_position_unique because `position - 1` shifted rows
    // in an arbitrary order.
    await repository.deleteSection(adminId, albumId, before!.sections[0].id);

    const after = await repository.getAlbum(albumId);
    expect(after?.sections).toHaveLength(19);
    expect(after?.sections.map((section) => section.position)).toEqual(
      Array.from({ length: 19 }, (_, index) => index + 1),
    );
  });

  it("deletes a middle page created by range", async () => {
    const before = await repository.getAlbum(albumId);
    await repository.deleteSection(adminId, albumId, before!.sections[9].id);
    const after = await repository.getAlbum(albumId);
    expect(after?.sections).toHaveLength(18);
    expect(after?.sections.map((section) => section.position)).toEqual(
      Array.from({ length: 18 }, (_, index) => index + 1),
    );
  });

  it("detaches stickers instead of deleting them when the page goes away", async () => {
    const detail = await repository.getAlbum(albumId);
    const target = detail!.sections[0];
    await repository.createStickers(adminId, albumId, {
      codes: ["IT-1", "IT-2", "IT-3"],
      name: null,
      sectionId: target.id,
    });

    const withStickers = await repository.getAlbum(albumId);
    expect(withStickers!.stickers.filter((s) => s.sectionId === target.id)).toHaveLength(3);

    await repository.deleteSection(adminId, albumId, target.id);

    const after = await repository.getAlbum(albumId);
    expect(after!.stickers).toHaveLength(3);
    expect(after!.stickers.every((sticker) => sticker.sectionId === null)).toBe(true);
    expect(after!.sections.some((section) => section.id === target.id)).toBe(false);
  });

  it("keeps sticker positions stable and compact after a sticker deletion", async () => {
    const detail = await repository.getAlbum(albumId);
    const first = detail!.stickers[0];
    await repository.deleteSticker(adminId, albumId, first.id);
    const after = await repository.getAlbum(albumId);
    expect(after!.stickers.map((sticker) => sticker.position)).toEqual([1, 2]);
  });

  it("lists independent real counts, including unassigned stickers, without multiplication", async () => {
    const emptyId = await repository.createAlbum(
      adminId,
      { title: "Resumen vacío", description: null, publisher: null, year: null, coverUrl: null },
      `resumen-vacio-${stamp}`,
    );
    const populatedId = await repository.createAlbum(
      adminId,
      { title: "Resumen poblado", description: null, publisher: null, year: null, coverUrl: null },
      `resumen-poblado-${stamp}`,
    );
    summaryAlbumIds.push(emptyId, populatedId);
    await repository.createSections(adminId, populatedId, ["Página A", "Página B", "Página C"]);
    const populated = await repository.getAlbum(populatedId);
    await repository.createStickers(adminId, populatedId, {
      codes: ["ASSIGNED-1", "ASSIGNED-2"], name: null, sectionId: populated!.sections[0].id,
    });
    await repository.createStickers(adminId, populatedId, {
      codes: ["UNASSIGNED-1", "UNASSIGNED-2"], name: null, sectionId: null,
    });

    const summaries = await repository.listAlbums();
    const current = summaries.find((album) => album.id === albumId);
    const empty = summaries.find((album) => album.id === emptyId);
    const populatedSummary = summaries.find((album) => album.id === populatedId);

    expect(current).toMatchObject({ sectionCount: 17, stickerCount: 2 });
    expect(empty).toMatchObject({ sectionCount: 0, stickerCount: 0 });
    expect(populatedSummary).toMatchObject({ sectionCount: 3, stickerCount: 4 });
  });

  it("rejects a non-admin actor before any mutation", async () => {
    const [plain] = await sql`
      insert into users (username, email, email_owner_type, role, status, password_hash)
      values (${`it_user_${stamp}`}, ${`it_user_${stamp}@example.com`}, 'self', 'user', 'active', 'x')
      returning id`;
    const detail = await repository.getAlbum(albumId);
    await expect(
      repository.deleteSection(plain.id, albumId, detail!.sections[0].id),
    ).rejects.toMatchObject({ code: "forbidden" });
    const after = await repository.getAlbum(albumId);
    expect(after!.sections).toHaveLength(detail!.sections.length);
    await sql`delete from users where id = ${plain.id}`;
  });
});
