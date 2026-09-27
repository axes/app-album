import { describe, expect, it } from "vitest";

import {
  CatalogError,
  type CatalogErrorCode,
  CatalogService,
  type CatalogRepository,
  type StickerBulkInput,
} from "./service";

/**
 * Pure unit coverage for the bulk-selection orchestration. The PostgreSQL side
 * is exercised separately by the integration suite.
 */

function uuid(tail: number): string {
  return `00000000-0000-4000-8000-0000000000${tail.toString(16).padStart(2, "0")}`;
}

// Deterministic UUIDs so every test uses values that actually parse.
const ACTOR = uuid(1);
const ALBUM = uuid(2);
const SECTION = uuid(3);
const STICKER_A = uuid(10);
const STICKER_B = uuid(11);
const STICKER_C = uuid(12);
const STICKER_D = uuid(13);

async function expectCatalogError(
  action: () => Promise<unknown>,
  expectedCode: CatalogErrorCode,
) {
  let caught: unknown;
  try {
    await action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(CatalogError);
  expect((caught as CatalogError).code).toBe(expectedCode);
}

class BulkRecordingRepository implements CatalogRepository {
  public calls: Array<{ method: string; values: unknown[] }> = [];
  listAlbums() { return Promise.resolve([]); }
  getAlbum() { return Promise.resolve(null); }
  createAlbum() { return Promise.resolve(uuid(99)); }
  updateAlbum() { return Promise.resolve(); }
  changeAlbumStatus() { return Promise.resolve(); }
  deleteAlbum() { return Promise.resolve(); }
  createSection() { return Promise.resolve(); }
  renameSection() { return Promise.resolve(); }
  moveSection() { return Promise.resolve(); }
  deleteSection() { return Promise.resolve(); }
  createSticker() { return Promise.resolve(); }
  createStickers(_a: string, _b: string, input: StickerBulkInput) {
    return Promise.resolve(input.codes.length);
  }
  createSections(_a: string, _b: string, names: string[]) {
    return Promise.resolve(names.length);
  }
  updateSticker() { return Promise.resolve(); }
  moveSticker() { return Promise.resolve(); }
  deleteSticker() { return Promise.resolve(); }
  bulkAssignStickerSection(actor: string, album: string, ids: string[], sectionId: string | null) {
    this.calls.push({ method: "bulkAssignStickerSection", values: [actor, album, ids, sectionId] });
    return Promise.resolve(ids.length);
  }
  bulkDeleteStickers(actor: string, album: string, ids: string[]) {
    this.calls.push({ method: "bulkDeleteStickers", values: [actor, album, ids] });
    return Promise.resolve(ids.length);
  }
}

describe("bulk sticker operations (orchestration)", () => {
  it("asks the repository to reassign every selected sticker to the chosen page", async () => {
    const repo = new BulkRecordingRepository();
    const service = new CatalogService(repo);
    const stickers = [STICKER_A, STICKER_B, STICKER_C, STICKER_D];
    const updated = await service.bulkAssignStickerSection(ACTOR, ALBUM, stickers, SECTION);
    expect(updated).toBe(4);
    expect(repo.calls).toEqual([
      { method: "bulkAssignStickerSection", values: [ACTOR, ALBUM, stickers, SECTION] },
    ]);
  });

  it("passes null through when the destination is 'Sin página asignada'", async () => {
    const repo = new BulkRecordingRepository();
    const service = new CatalogService(repo);
    await service.bulkAssignStickerSection(ACTOR, ALBUM, [STICKER_A], null);
    expect(repo.calls[0]?.values[3]).toBeNull();
  });

  it("refuses empty sticker batches before reaching the repository", async () => {
    const repo = new BulkRecordingRepository();
    const service = new CatalogService(repo);
    await expectCatalogError(
      () => service.bulkAssignStickerSection(ACTOR, ALBUM, [], null),
      "invalid_input",
    );
    expect(repo.calls).toHaveLength(0);
  });

  it("rejects duplicate sticker ids inside the batch", async () => {
    const repo = new BulkRecordingRepository();
    const service = new CatalogService(repo);
    await expectCatalogError(
      () => service.bulkAssignStickerSection(ACTOR, ALBUM, [STICKER_A, STICKER_A], null),
      "duplicate_in_input",
    );
    expect(repo.calls).toHaveLength(0);
  });

  it("rejects malformed sticker ids before reaching the repository", async () => {
    const repo = new BulkRecordingRepository();
    const service = new CatalogService(repo);
    await expectCatalogError(
      () => service.bulkAssignStickerSection(ACTOR, ALBUM, ["not-a-uuid"], null),
      "invalid_input",
    );
    expect(repo.calls).toHaveLength(0);
  });

  it("rejects malformed section ids before reaching the repository", async () => {
    const repo = new BulkRecordingRepository();
    const service = new CatalogService(repo);
    await expectCatalogError(
      () => service.bulkAssignStickerSection(ACTOR, ALBUM, [STICKER_A], "garbage"),
      "invalid_input",
    );
    expect(repo.calls).toHaveLength(0);
  });

  it("refuses bulk delete on an empty selection", async () => {
    const repo = new BulkRecordingRepository();
    const service = new CatalogService(repo);
    await expectCatalogError(
      () => service.bulkDeleteStickers(ACTOR, ALBUM, []),
      "invalid_input",
    );
    expect(repo.calls).toHaveLength(0);
  });

  it("dispatches a non-empty bulk delete as a single repository call", async () => {
    const repo = new BulkRecordingRepository();
    const service = new CatalogService(repo);
    const ids = [STICKER_A, STICKER_B];
    const removed = await service.bulkDeleteStickers(ACTOR, ALBUM, ids);
    expect(removed).toBe(2);
    expect(repo.calls).toEqual([
      { method: "bulkDeleteStickers", values: [ACTOR, ALBUM, ids] },
    ]);
  });
});
