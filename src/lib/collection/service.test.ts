import { describe, expect, it } from "vitest";
import {
  CollectionError,
  CollectionService,
  computeProgress,
  type AlbumHeader,
  type CollectionRepository,
  type Progress,
  type PublishedAlbumListing,
  type SetQuantityInput,
  type StickerQuantityChange,
  type UserAlbum,
  type UserAlbumDetail,
  type UserAlbumListing,
} from "./service";

const USER_A = "00000000-0000-4000-8000-000000000001";
const USER_B = "00000000-0000-4000-8000-000000000002";
const ADMIN = "00000000-0000-4000-8000-000000000003";
const ALBUM_ID = "00000000-0000-4000-8000-000000000010";
const STICKER_MINE = "00000000-0000-4000-8000-000000000030";
const STICKER_OTHER = "00000000-0000-4000-8000-000000000031";

const header = (status: AlbumHeader["status"] = "published"): AlbumHeader => ({
  id: ALBUM_ID, title: "Álbum", publisher: "Panini", year: 2026, coverUrl: null, status,
});

type Stored = {
  quantity: number;
};

class InMemoryRepository implements CollectionRepository {
  users: Map<string, UserAlbum> = new Map();
  headers: Map<string, AlbumHeader> = new Map();
  stickers: Map<string, string> = new Map(); // stickerId -> albumId
  entries: Map<string, Map<string, Stored>> = new Map(); // userAlbumId -> stickerId -> row
  counters = { albumHasCollections: 0, stickerHasProgress: 0 };
  albumHasCollections(albumId: string): Promise<boolean> {
    this.counters.albumHasCollections += 1;
    return Promise.resolve(Array.from(this.users.values()).some((row) => row.albumId === albumId));
  }
  stickerHasProgress(stickerId: string): Promise<boolean> {
    this.counters.stickerHasProgress += 1;
    for (const rows of this.entries.values()) if (rows.has(stickerId)) return Promise.resolve(true);
    return Promise.resolve(false);
  }
  async addAlbum(actorId: string, albumId: string): Promise<UserAlbum> {
    const hd = this.headers.get(albumId);
    if (!hd) throw new CollectionError("not_found");
    if (hd.status !== "published") throw new CollectionError("album_not_published");
    if (Array.from(this.users.values()).some((row) => row.userId === actorId && row.albumId === albumId)) {
      throw new CollectionError("duplicate_collection");
    }
    const id = crypto.randomUUID();
    const row = { id, userId: actorId, albumId, createdAt: new Date() };
    this.users.set(id, row);
    return row;
  }
  async getAlbumForOwner(userId: string, userAlbumId: string): Promise<UserAlbum | null> {
    const row = this.users.get(userAlbumId);
    if (!row || row.userId !== userId) return null;
    return row;
  }
  async listAlbumsForOwner(userId: string): Promise<UserAlbum[]> {
    return Array.from(this.users.values()).filter((row) => row.userId === userId);
  }
  async listPublishedAlbums(userId: string): Promise<PublishedAlbumListing[]> {
    return Array.from(this.headers.values())
      .filter((album) => album.status === "published")
      .map((album) => ({
        ...album,
        stickerCount: Array.from(this.stickers.values()).filter((id) => id === album.id).length,
        userAlbumId: Array.from(this.users.values()).find(
          (row) => row.userId === userId && row.albumId === album.id,
        )?.id ?? null,
      }));
  }
  async listAlbumsByOwnerWithProgress(userId: string): Promise<UserAlbumListing[]> {
    const rows = await this.listAlbumsForOwner(userId);
    return rows.map((row) => this.decorate(row));
  }
  async getAlbumDetail(userId: string, userAlbumId: string): Promise<UserAlbumDetail | null> {
    const row = this.users.get(userAlbumId);
    if (!row || row.userId !== userId) return null;
    const header = this.headers.get(row.albumId);
    if (!header) return null;
    const entries = this.entries.get(row.id) ?? new Map();
    const stickers = Array.from(this.stickers.entries()).filter(([, album]) => album === row.albumId);
    const quantities = stickers.map(([stickerId]) => entries.get(stickerId)?.quantity ?? 0);
    const progress = computeProgress(quantities, stickers.length);
    return { ...row, album: header, progress, sections: [], unassigned: [] };
  }
  async removeAlbum(actorId: string, userAlbumId: string): Promise<void> {
    const row = this.users.get(userAlbumId);
    if (!row || row.userId !== actorId) throw new CollectionError("forbidden");
    this.entries.delete(userAlbumId);
    this.users.delete(userAlbumId);
  }
  async findAlbumHeader(albumId: string): Promise<AlbumHeader | null> {
    return this.headers.get(albumId) ?? null;
  }
  async listQuantities(userId: string, userAlbumId: string): Promise<Map<string, number>> {
    const row = this.users.get(userAlbumId);
    if (!row || row.userId !== userId) throw new CollectionError("forbidden");
    const entries = this.entries.get(userAlbumId) ?? new Map();
    const map = new Map<string, number>();
    for (const [key, value] of entries.entries()) map.set(key, value.quantity);
    return map;
  }
  async adjustQuantity(
    actorId: string,
    userAlbumId: string,
    stickerId: string,
    change: StickerQuantityChange,
    quantity?: number,
  ): Promise<void> {
    const row = this.users.get(userAlbumId);
    if (!row || row.userId !== actorId) throw new CollectionError("forbidden");
    const stickerAlbumId = this.stickers.get(stickerId);
    if (!stickerAlbumId || stickerAlbumId !== row.albumId) {
      throw new CollectionError("sticker_not_in_album");
    }
    const bucket = this.entries.get(userAlbumId) ?? new Map();
    const before = bucket.get(stickerId)?.quantity ?? 0;
    const target = applyChange(before, change, quantity);
    if (target === before) return;
    if (target < 1) {
      bucket.delete(stickerId);
    } else {
      bucket.set(stickerId, { quantity: target });
    }
    this.entries.set(userAlbumId, bucket);
  }
  private decorate(row: UserAlbum): UserAlbumListing {
    const header = this.headers.get(row.albumId);
    if (!header) throw new CollectionError("not_found");
    const entries = this.entries.get(row.id) ?? new Map();
    const stickersForAlbum = Array.from(this.stickers.entries()).filter(([, album]) => album === row.albumId);
    const quantities = stickersForAlbum.map(([stickerId]) => entries.get(stickerId)?.quantity ?? 0);
    const progress = computeProgress(quantities, stickersForAlbum.length);
    return { ...row, album: header, progress };
  }
}

function applyChange(current: number, change: StickerQuantityChange, quantity?: number) {
  if (change === "increment") return Math.min(1000, Math.max(0, current + 1));
  if (change === "decrement") return Math.max(0, current - 1);
  return Math.max(0, Math.floor(quantity ?? 0));
}

function seed(repository: InMemoryRepository) {
  repository.headers.set(ALBUM_ID, header());
  repository.headers.set("00000000-0000-4000-8000-000000000099", header("draft"));
  repository.stickers.set(STICKER_MINE, ALBUM_ID);
  repository.stickers.set(STICKER_OTHER, "00000000-0000-4000-8000-000000000999");
}

describe("collection progress math", () => {
  it("reports empty progress when no quantities exist", () => {
    const result = computeProgress([], 0);
    expect(result).toEqual<Progress>({ total: 0, owned: 0, missing: 0, duplicates: 0, percentage: 0 });
  });
  it("counts ownership and computes percentage", () => {
    // Only quantities >= 1 are persisted; the "0" entry simulates the absence
    // of a row for a sticker that has not been marked yet.
    const result = computeProgress([1, 1, 3, 2], 5);
    expect(result).toEqual<Progress>({ total: 5, owned: 4, missing: 1, duplicates: 3, percentage: 80 });
  });
  it("rounds the percentage and avoids division by zero", () => {
    expect(computeProgress([], 0).percentage).toBe(0);
    expect(computeProgress([1], 3).percentage).toBe(33);
    expect(computeProgress([2, 1, 1], 3).percentage).toBe(100);
  });
});

describe("collection service", () => {
  it("adds a published album but rejects a draft", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const row = await service.addAlbum(USER_A, ALBUM_ID);
    expect(row.userId).toBe(USER_A);
    expect(row.albumId).toBe(ALBUM_ID);
    expect(repository.users.size).toBe(1);

    await expect(service.addAlbum(USER_A, "00000000-0000-4000-8000-000000000099")).rejects.toBeInstanceOf(CollectionError);
  });

  it("does not create progress rows on add", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const row = await service.addAlbum(USER_A, ALBUM_ID);
    expect(repository.entries.get(row.id)?.size ?? 0).toBe(0);
  });

  it("refuses to add a duplicate collection", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    await service.addAlbum(USER_A, ALBUM_ID);
    await expect(service.addAlbum(USER_A, ALBUM_ID)).rejects.toMatchObject({ code: "duplicate_collection" });
  });

  it("rejects malformed ids before touching the repository", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    try {
      await service.addAlbum("not-a-uuid", ALBUM_ID);
      throw new Error("expected forbidden");
    } catch (error) {
      expect(error).toBeInstanceOf(CollectionError);
      expect((error as CollectionError).code).toBe("forbidden");
    }
    try {
      await service.addAlbum(USER_A, "bad");
      throw new Error("expected invalid_input");
    } catch (error) {
      expect(error).toBeInstanceOf(CollectionError);
      expect((error as CollectionError).code).toBe("invalid_input");
    }
    expect(repository.users.size).toBe(0);
  });

  it("blocks ownership crossings on read/write/delete", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const userA = await service.addAlbum(USER_A, ALBUM_ID);
    repository.users.set(userA.id, { ...userA });

    await expect(service.getAlbumForOwner(USER_B, userA.id)).rejects.toBeInstanceOf(CollectionError);
    await expect(service.getAlbumDetail(USER_B, userA.id)).rejects.toBeInstanceOf(CollectionError);
    await expect(service.adjustQuantity(USER_B, userA.id, STICKER_MINE, { change: "increment" })).rejects.toBeInstanceOf(CollectionError);
    await expect(service.removeAlbum(USER_B, userA.id)).rejects.toBeInstanceOf(CollectionError);
    // Admin without ownership must be rejected too: admin has no special
    // privilege on collections in this service.
    await expect(service.removeAlbum(ADMIN, userA.id)).rejects.toBeInstanceOf(CollectionError);
    expect(repository.users.size).toBe(1);
  });

  it("treats absence of a row as quantity 0 and never persists zero", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const userA = await service.addAlbum(USER_A, ALBUM_ID);
    const quantities = await service.listAlbumsForOwner(USER_A);
    expect(quantities[0]?.progress.owned).toBe(0);
    // The seeded fake repo keeps one sticker registered for the album, so the
    // missing count reflects "owned < total" before any interaction.
    expect(quantities[0]?.progress.missing).toBe(1);

    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "increment" });
    const after = (await service.listQuantities(USER_A, userA.id)).get(STICKER_MINE);
    expect(after).toBe(1);
  });

  it("supports increment, decrement and deletes when reaching 0", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const userA = await service.addAlbum(USER_A, ALBUM_ID);
    const inc: SetQuantityInput = { change: "increment" };
    const dec: SetQuantityInput = { change: "decrement" };

    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, inc);
    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, inc);
    expect((await service.listQuantities(USER_A, userA.id)).get(STICKER_MINE)).toBe(2);

    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, dec);
    expect((await service.listQuantities(USER_A, userA.id)).get(STICKER_MINE)).toBe(1);

    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, dec);
    expect((await service.listQuantities(USER_A, userA.id)).get(STICKER_MINE)).toBeUndefined();

    // decrement on a missing row remains 0
    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, dec);
    expect((await service.listQuantities(USER_A, userA.id)).get(STICKER_MINE)).toBeUndefined();
  });

  it("does not expose another user's quantities", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const userA = await service.addAlbum(USER_A, ALBUM_ID);
    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "increment" });

    await expect(service.listQuantities(USER_B, userA.id)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("supports `set` with quantity zero which deletes the row", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const userA = await service.addAlbum(USER_A, ALBUM_ID);
    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "set", quantity: 3 });
    expect((await service.listQuantities(USER_A, userA.id)).get(STICKER_MINE)).toBe(3);
    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "set", quantity: 0 });
    expect((await service.listQuantities(USER_A, userA.id)).get(STICKER_MINE)).toBeUndefined();
  });

  it("rejects a sticker that does not belong to the album", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const userA = await service.addAlbum(USER_A, ALBUM_ID);
    await expect(service.adjustQuantity(USER_A, userA.id, STICKER_OTHER, { change: "increment" }))
      .rejects.toMatchObject({ code: "sticker_not_in_album" });
  });

  it("removes the owner and its progress", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const userA = await service.addAlbum(USER_A, ALBUM_ID);
    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "increment" });
    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "increment" });
    expect(repository.entries.get(userA.id)?.size).toBe(1);
    await service.removeAlbum(USER_A, userA.id);
    expect(repository.users.size).toBe(0);
    expect(repository.entries.get(userA.id)).toBeUndefined();
  });

  it("caps increments at the domain maximum", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const userA = await service.addAlbum(USER_A, ALBUM_ID);
    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "set", quantity: 1000 });
    await service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "increment" });

    expect((await service.listQuantities(USER_A, userA.id)).get(STICKER_MINE)).toBe(1000);
  });

  it("rejects invalid set payloads before touching the repository", async () => {
    const repository = new InMemoryRepository();
    seed(repository);
    const service = new CollectionService(repository);
    const userA = await service.addAlbum(USER_A, ALBUM_ID);
    expect(() => service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "set" })).toThrow(CollectionError);
    expect(() => service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "increment", quantity: 2 })).toThrow(CollectionError);
    expect(() => service.adjustQuantity(USER_A, userA.id, STICKER_MINE, { change: "no-such" } as unknown as SetQuantityInput)).toThrow(CollectionError);
    expect(repository.entries.size).toBe(0);
  });
});
