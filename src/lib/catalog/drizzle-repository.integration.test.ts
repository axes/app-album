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
  const collectorIds: string[] = [];

  async function collectorId(stampValue: number, index: number): Promise<string> {
    const [row] = await sql`
      insert into users (username, email, email_owner_type, role, status, password_hash)
      values (
        ${`it_coll_${stampValue}_${index}`},
        ${`it_coll_${stampValue}_${index}@example.com`},
        'self', 'user', 'active', 'x'
      )
      returning id`;
    collectorIds.push(row.id as string);
    return row.id as string;
  }

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
    if (collectorIds.length > 0) {
      await sql`delete from user_albums where user_id = any(${collectorIds}::uuid[])`;
    }
    await sql`delete from user_albums where album_id = any(${allAlbumIds}::uuid[])`;
    await sql`delete from stickers where album_id = any(${allAlbumIds}::uuid[])`;
    await sql`delete from album_sections where album_id = any(${allAlbumIds}::uuid[])`;
    await sql`delete from album_admin_events where album_id = any(${allAlbumIds}::uuid[])`;
    await sql`delete from albums where id = any(${allAlbumIds}::uuid[])`;
    if (collectorIds.length > 0) {
      await sql`delete from users where id = any(${collectorIds}::uuid[])`;
    }
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

    expect(current).toMatchObject({ sectionCount: 17, stickerCount: 2, collectionCount: 0 });
    expect(empty).toMatchObject({ sectionCount: 0, stickerCount: 0, collectionCount: 0 });
    expect(populatedSummary).toMatchObject({ sectionCount: 3, stickerCount: 4, collectionCount: 0 });
  });

  it(
    "reports collectionCount without cartesian multiplication against pages × stickers",
    async () => {
      // Build an album whose page × sticker fan-out would amplify a naive
      // JOIN user_albums. Three collectors and a 2-page / 6-sticker body must
      // still produce `collectionCount: 3` — not 18, not 12, not 6.
      const cartesianId = await repository.createAlbum(
        adminId,
        { title: "Cartesiano", description: null, publisher: null, year: null, coverUrl: null },
        `cartesiano-${stamp}`,
      );
      summaryAlbumIds.push(cartesianId);
      await repository.createSections(adminId, cartesianId, ["Página 1", "Página 2"]);
      const detail = await repository.getAlbum(cartesianId);
      await repository.createStickers(adminId, cartesianId, {
        codes: ["CX-1", "CX-2", "CX-3", "CX-4"], name: null, sectionId: detail!.sections[0].id,
      });
      await repository.createStickers(adminId, cartesianId, {
        codes: ["CX-5", "CX-6"], name: null, sectionId: detail!.sections[1].id,
      });
      await repository.changeAlbumStatus(adminId, cartesianId, "published");

      for (let i = 0; i < 3; i++) {
        const user = await collectorId(stamp, i);
        await sql`insert into user_albums (user_id, album_id) values (${user}, ${cartesianId})`;
      }

      const summaries = await repository.listAlbums();
      const cartesian = summaries.find((album) => album.id === cartesianId);
      expect(cartesian).toMatchObject({ sectionCount: 2, stickerCount: 6, collectionCount: 3 });
    },
  );

  it(
    "keeps collectionCount at 0 for an empty album and at 1 for a draft that has been collected",
    async () => {
      const zeroId = await repository.createAlbum(
        adminId,
        { title: "Cero", description: null, publisher: null, year: null, coverUrl: null },
        `cero-${stamp}`,
      );
      const draftId = await repository.createAlbum(
        adminId,
        { title: "Borrador con colección", description: null, publisher: null, year: null, coverUrl: null },
        `borrador-con-coleccion-${stamp}`,
      );
      summaryAlbumIds.push(zeroId, draftId);
      const collector = await collectorId(stamp, 9);
      await sql`insert into user_albums (user_id, album_id) values (${collector}, ${draftId})`;

      const summaries = await repository.listAlbums();
      const zero = summaries.find((album) => album.id === zeroId);
      const draftSummary = summaries.find((album) => album.id === draftId);
      expect(zero).toMatchObject({ collectionCount: 0 });
      expect(draftSummary).toMatchObject({ status: "draft", collectionCount: 1 });
    },
  );

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

  it(
    "publishes an album that has stickers but no pages",
    async () => {
      const zeroPagesId = await repository.createAlbum(
        adminId,
        { title: "Sin páginas con stickers", description: null, publisher: null, year: null, coverUrl: null },
        `sin-paginas-con-stickers-${stamp}`,
      );
      summaryAlbumIds.push(zeroPagesId);
      const created = await repository.createStickers(adminId, zeroPagesId, {
        codes: ["SP-001", "SP-002", "SP-003"],
        name: null,
        sectionId: null,
      });
      expect(created).toBe(3);
      const beforePublish = await repository.getAlbum(zeroPagesId);
      expect(beforePublish?.stickerCount).toBe(3);
      await expect(
        repository.changeAlbumStatus(adminId, zeroPagesId, "published"),
      ).resolves.toBeUndefined();
      const after = await repository.getAlbum(zeroPagesId);
      expect(after?.status).toBe("published");
      expect(after?.sectionCount).toBe(0);
      expect(after?.stickerCount).toBe(3);
      expect(after!.stickers.every((sticker) => sticker.sectionId === null)).toBe(true);
    },
  );

  it(
    "rejects publishing an album that has pages but no stickers",
    async () => {
      const pagesOnlyId = await repository.createAlbum(
        adminId,
        { title: "Solo páginas", description: null, publisher: null, year: null, coverUrl: null },
        `solo-paginas-${stamp}`,
      );
      summaryAlbumIds.push(pagesOnlyId);
      await repository.createSections(adminId, pagesOnlyId, ["Página 1", "Página 2"]);
      await expect(
        repository.changeAlbumStatus(adminId, pagesOnlyId, "published"),
      ).rejects.toMatchObject({ code: "publication_incomplete" });
      const after = await repository.getAlbum(pagesOnlyId);
      expect(after?.status).toBe("draft");
    },
  );

  describe("bulk sticker operations (integration)", () => {
    let bulkAlbumId = "";

    beforeAll(async () => {
      bulkAlbumId = await repository.createAlbum(
        adminId,
        { title: "Masivo", description: null, publisher: null, year: null, coverUrl: null },
        `masivo-${stamp}`,
      );
      await repository.createSections(adminId, bulkAlbumId, ["Página A", "Página B"]);
    });

    afterAll(async () => {
      summaryAlbumIds.push(bulkAlbumId);
    });

    it("bulk-assigns ten stickers to the chosen page and zero to another", async () => {
      const detail = await repository.getAlbum(bulkAlbumId);
      const pageA = detail!.sections.find((section) => section.name === "Página A")!;
      const pageB = detail!.sections.find((section) => section.name === "Página B")!;
      const codes = Array.from({ length: 10 }, (_, index) => `BLK-${index + 1}`);
      await repository.createStickers(adminId, bulkAlbumId, { codes, name: null, sectionId: null });
      const reloaded = await repository.getAlbum(bulkAlbumId);
      const stickerIds = reloaded!.stickers
        .filter((sticker) => codes.includes(sticker.code))
        .map((sticker) => sticker.id);

      const updated = await repository.bulkAssignStickerSection(adminId, bulkAlbumId, stickerIds, pageA.id);
      expect(updated).toBe(10);

      const after = await repository.getAlbum(bulkAlbumId);
      const onA = after!.stickers.filter((sticker) => sticker.sectionId === pageA.id);
      const onB = after!.stickers.filter((sticker) => sticker.sectionId === pageB.id);
      expect(onA.filter((sticker) => codes.includes(sticker.code))).toHaveLength(10);
      expect(onB.filter((sticker) => codes.includes(sticker.code))).toHaveLength(0);
    });

    it("moves stickers across pages and back to 'Sin página asignada'", async () => {
      const detail = await repository.getAlbum(bulkAlbumId);
      const pageB = detail!.sections.find((section) => section.name === "Página B")!;
      const firstFive = detail!.stickers.filter((sticker) => sticker.code.startsWith("BLK-")).slice(0, 5)
        .map((sticker) => sticker.id);
      const lastFive = detail!.stickers.filter((sticker) => sticker.code.startsWith("BLK-")).slice(5, 10)
        .map((sticker) => sticker.id);

      await repository.bulkAssignStickerSection(adminId, bulkAlbumId, firstFive, pageB.id);
      await repository.bulkAssignStickerSection(adminId, bulkAlbumId, lastFive, null);

      const after = await repository.getAlbum(bulkAlbumId);
      expect(after!.stickers.filter((sticker) => firstFive.includes(sticker.id)).every((sticker) => sticker.sectionId === pageB.id)).toBe(true);
      expect(after!.stickers.filter((sticker) => lastFive.includes(sticker.id)).every((sticker) => sticker.sectionId === null)).toBe(true);
    });

    it("rejects a section id that belongs to a different album", async () => {
      const otherId = await repository.createAlbum(
        adminId,
        { title: "Otro álbum masivas", description: null, publisher: null, year: null, coverUrl: null },
        `otro-masivas-${stamp}`,
      );
      summaryAlbumIds.push(otherId);
      await repository.createSections(adminId, otherId, ["Página X"]);
      const other = await repository.getAlbum(otherId);
      const [sticker] = (await repository.getAlbum(bulkAlbumId))!.stickers.filter((row) => row.code.startsWith("BLK-"));
      await expect(
        repository.bulkAssignStickerSection(adminId, bulkAlbumId, [sticker.id], other!.sections[0].id),
      ).rejects.toMatchObject({ code: "invalid_section" });

      const after = await repository.getAlbum(bulkAlbumId);
      expect(after!.stickers.find((row) => row.id === sticker.id)?.sectionId).toBe(sticker.sectionId);
    });

    it("rejects stickers that belong to a different album without mutating the rest", async () => {
      const detail = await repository.getAlbum(bulkAlbumId);
      const pageA = detail!.sections.find((section) => section.name === "Página A")!;
      const otherId = await repository.createAlbum(
        adminId,
        { title: "Foráneo", description: null, publisher: null, year: null, coverUrl: null },
        `foraneo-${stamp}`,
      );
      summaryAlbumIds.push(otherId);
      await repository.createStickers(adminId, otherId, {
        codes: ["FOR-1"],
        name: null,
        sectionId: null,
      });
      const foreign = (await repository.getAlbum(otherId))!.stickers[0];
      const validIds = detail!.stickers.slice(0, 3).map((sticker) => sticker.id);
      const mixed = [...validIds, foreign.id];
      const before = await repository.getAlbum(bulkAlbumId);
      await expect(
        repository.bulkAssignStickerSection(adminId, bulkAlbumId, mixed, pageA.id),
      ).rejects.toMatchObject({ code: "not_found" });
      const after = await repository.getAlbum(bulkAlbumId);
      expect(after!.stickers.filter((sticker) => validIds.includes(sticker.id)).map((sticker) => sticker.sectionId))
        .toEqual(before!.stickers.filter((sticker) => validIds.includes(sticker.id)).map((sticker) => sticker.sectionId));
    });

    it("rejects batched delete when one sticker has collector progress", async () => {
      const detail = await repository.getAlbum(bulkAlbumId);
      const target = detail!.stickers.find((sticker) => sticker.code === "BLK-1")!;
      const collector = await collectorId(stamp, 42);
      await sql`insert into user_albums (user_id, album_id) values (${collector}, ${bulkAlbumId})`;
      const userAlbums = await sql`
        select id from user_albums where user_id = ${collector} and album_id = ${bulkAlbumId}
      `;
      expect(userAlbums).toHaveLength(1);
      const uaId = userAlbums[0].id as string;
      await sql`insert into user_album_stickers (user_album_id, sticker_id, quantity) values (${uaId}, ${target.id}, 1)`;

      const candidates = detail!.stickers.filter((sticker) => sticker.code.startsWith("BLK-"))
        .slice(0, 5)
        .map((sticker) => sticker.id);
      // Ensure one of the five has progress
      expect(candidates).toContain(target.id);

      const before = await repository.getAlbum(bulkAlbumId);
      await expect(
        repository.bulkDeleteStickers(adminId, bulkAlbumId, candidates),
      ).rejects.toMatchObject({ code: "sticker_has_progress" });
      const after = await repository.getAlbum(bulkAlbumId);
      expect(after!.stickers).toHaveLength(before!.stickers.length);

      // Clean up the progress row so a later "successful delete" test stays
      // deterministic.
      await sql`delete from user_album_stickers where sticker_id = ${target.id}`;
      await sql`delete from user_albums where id = ${uaId}`;
    });

    it("deletes several stickers with no progress and compacts positions", async () => {
      const detail = await repository.getAlbum(bulkAlbumId);
      const remaining = detail!.stickers.filter((sticker) => sticker.code.startsWith("BLK-"));
      const toRemove = remaining.slice(0, 4).map((sticker) => sticker.id);
      const beforeCount = remaining.length;

      const removed = await repository.bulkDeleteStickers(adminId, bulkAlbumId, toRemove);
      expect(removed).toBe(4);

      const after = await repository.getAlbum(bulkAlbumId);
      expect(after!.stickers.length).toBe(detail!.stickers.length - 4);
      // Every remaining sticker keeps a contiguous, gap-free position starting at 1.
      const positions = after!.stickers.map((sticker) => sticker.position).sort((a, b) => a - b);
      expect(positions).toEqual(Array.from({ length: positions.length }, (_, index) => index + 1));
      // No phantom BLK codes remain.
      expect(after!.stickers.some((sticker) => toRemove.includes(sticker.id))).toBe(false);
      void beforeCount;
    });

    it("rejects bulk delete when a sticker id belongs to another album", async () => {
      const otherId = await repository.createAlbum(
        adminId,
        { title: "Borrar foráneo", description: null, publisher: null, year: null, coverUrl: null },
        `borrar-foraneo-${stamp}`,
      );
      summaryAlbumIds.push(otherId);
      await repository.createStickers(adminId, otherId, {
        codes: ["FOR-DEL-1"],
        name: null,
        sectionId: null,
      });
      const foreign = (await repository.getAlbum(otherId))!.stickers[0];
      const [valid] = (await repository.getAlbum(bulkAlbumId))!.stickers.filter((row) => row.code.startsWith("BLK-"))
        .map((sticker) => sticker.id);
      const before = (await repository.getAlbum(bulkAlbumId))!.stickers.length;

      await expect(
        repository.bulkDeleteStickers(adminId, bulkAlbumId, [valid, foreign.id]),
      ).rejects.toMatchObject({ code: "not_found" });
      const after = await repository.getAlbum(bulkAlbumId);
      expect(after!.stickers).toHaveLength(before);
    });
  });
});
