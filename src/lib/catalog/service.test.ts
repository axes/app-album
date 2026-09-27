import { describe, expect, it } from "vitest";
import {
  CatalogError,
  CatalogService,
  resolveUniqueSlug,
  slugifyTitle,
  type AlbumDetail,
  type AlbumInput,
  type AlbumSummary,
  type CatalogRepository,
  type Direction,
  type StickerBulkInput,
} from "./service";

const A = "00000000-0000-4000-8000-000000000001";
const B = "00000000-0000-4000-8000-000000000002";
const C = "00000000-0000-4000-8000-000000000003";

class RecordingRepository implements CatalogRepository {
  calls: Array<{ method: string; values: unknown[] }> = [];
  listAlbums(): Promise<AlbumSummary[]> { return Promise.resolve([]); }
  getAlbum(id: string): Promise<AlbumDetail | null> { this.calls.push({ method: "get", values: [id] }); return Promise.resolve(null); }
  createAlbum(actor: string, input: AlbumInput, slug: string): Promise<string> { this.calls.push({ method: "create", values: [actor, input, slug] }); return Promise.resolve(B); }
  updateAlbum(actor: string, album: string, input: AlbumInput) { this.calls.push({ method: "update", values: [actor, album, input] }); return Promise.resolve(); }
  changeAlbumStatus(actor: string, album: string, status: "draft" | "published") { this.calls.push({ method: "status", values: [actor, album, status] }); return Promise.resolve(); }
  deleteAlbum(actor: string, album: string) { this.calls.push({ method: "deleteAlbum", values: [actor, album] }); return Promise.resolve(); }
  createSection(actor: string, album: string, name: string) { this.calls.push({ method: "createSection", values: [actor, album, name] }); return Promise.resolve(); }
  renameSection(actor: string, album: string, section: string, name: string) { this.calls.push({ method: "renameSection", values: [actor, album, section, name] }); return Promise.resolve(); }
  moveSection(actor: string, album: string, section: string, direction: Direction) { this.calls.push({ method: "moveSection", values: [actor, album, section, direction] }); return Promise.resolve(); }
  deleteSection(actor: string, album: string, section: string) { this.calls.push({ method: "deleteSection", values: [actor, album, section] }); return Promise.resolve(); }
  createSticker(actor: string, album: string, input: { code: string; name: string | null; sectionId: string | null }) { this.calls.push({ method: "createSticker", values: [actor, album, input] }); return Promise.resolve(); }
  createStickers(actor: string, album: string, input: StickerBulkInput) { this.calls.push({ method: "createStickers", values: [actor, album, input] }); return Promise.resolve(input.codes.length); }
  createSections(actor: string, album: string, names: string[]) { this.calls.push({ method: "createSections", values: [actor, album, names] }); return Promise.resolve(names.length); }
  updateSticker(actor: string, album: string, sticker: string, input: { code: string; name: string | null; sectionId: string | null }) { this.calls.push({ method: "updateSticker", values: [actor, album, sticker, input] }); return Promise.resolve(); }
  moveSticker(actor: string, album: string, sticker: string, direction: Direction) { this.calls.push({ method: "moveSticker", values: [actor, album, sticker, direction] }); return Promise.resolve(); }
  deleteSticker(actor: string, album: string, sticker: string) { this.calls.push({ method: "deleteSticker", values: [actor, album, sticker] }); return Promise.resolve(); }
}

const validAlbum = { title: " Mundial España 1982 ", description: "", publisher: " Panini ", year: "1982", coverUrl: "" };

describe("catalog service", () => {
  it("generates URL-safe slugs including accented titles", () => {
    expect(slugifyTitle("  Álbum Fútbol: Chile 2026! ")).toBe("album-futbol-chile-2026");
    expect(slugifyTitle("***")).toBe("album");
  });

  it("resolves slug collisions with stable numeric suffixes", async () => {
    const occupied = new Set(["copa-america", "copa-america-2"]);
    await expect(resolveUniqueSlug("copa-america", async (slug) => occupied.has(slug)))
      .resolves.toBe("copa-america-3");
  });

  it("creates a normalized album with a generated slug base", async () => {
    const repository = new RecordingRepository();
    const result = await new CatalogService(repository).createAlbum(A, validAlbum);
    expect(result).toBe(B);
    expect(repository.calls[0]).toMatchObject({ method: "create", values: [A, { title: "Mundial España 1982", description: null, publisher: "Panini", year: 1982, coverUrl: null }, "mundial-espana-1982"] });
  });

  it("supports editing, publishing, returning to draft and safe deletion calls", async () => {
    const repository = new RecordingRepository(); const service = new CatalogService(repository);
    await service.updateAlbum(A, B, validAlbum); await service.changeStatus(A, B, "published");
    await service.changeStatus(A, B, "draft"); await service.deleteAlbum(A, B);
    expect(repository.calls.map((call) => call.method)).toEqual(["update", "status", "status", "deleteAlbum"]);
  });

  it("accepts numeric and alphanumeric sticker codes as text", async () => {
    const repository = new RecordingRepository(); const service = new CatalogService(repository);
    for (const code of ["1", "100", "A1", "ESP-01", "LOGO", "CHECKLIST"]) {
      await service.createSticker(A, B, { code, name: "", sectionId: "" });
    }
    expect(repository.calls.map((call) => (call.values[2] as { code: string }).code)).toEqual(["1", "100", "A1", "ESP-01", "LOGO", "CHECKLIST"]);
  });

  it("dispatches section and sticker ordering deterministically", async () => {
    const repository = new RecordingRepository(); const service = new CatalogService(repository);
    await service.createSection(A, B, " Página 1 "); await service.renameSection(A, B, C, "Especiales");
    await service.moveSection(A, B, C, "up"); await service.moveSticker(A, B, C, "down");
    expect(repository.calls).toEqual([
      { method: "createSection", values: [A, B, "Página 1"] },
      { method: "renameSection", values: [A, B, C, "Especiales"] },
      { method: "moveSection", values: [A, B, C, "up"] },
      { method: "moveSticker", values: [A, B, C, "down"] },
    ]);
  });

  it("normalizes inline sticker updates including an empty name and no page", async () => {
    const repository = new RecordingRepository();
    const service = new CatalogService(repository);
    await service.updateSticker(A, B, C, { code: " ESP-01 ", name: "", sectionId: "" });
    expect(repository.calls).toEqual([
      { method: "updateSticker", values: [A, B, C, { code: "ESP-01", name: null, sectionId: null }] },
    ]);
  });

  it("accepts assigning an inline sticker update to a valid page id", async () => {
    const repository = new RecordingRepository();
    const service = new CatalogService(repository);
    await service.updateSticker(A, B, C, { code: "LOGO", name: "Logo", sectionId: A });
    expect(repository.calls[0]).toEqual({
      method: "updateSticker",
      values: [A, B, C, { code: "LOGO", name: "Logo", sectionId: A }],
    });
  });

  it("rejects malformed ids, fields, status and movement before persistence", async () => {    const repository = new RecordingRepository(); const service = new CatalogService(repository);
    await expect(service.createAlbum("bad", validAlbum)).rejects.toBeInstanceOf(CatalogError);
    expect(() => service.updateAlbum(A, B, { ...validAlbum, year: "1700" })).toThrow(CatalogError);
    expect(() => service.changeStatus(A, B, "archived")).toThrow(CatalogError);
    expect(() => service.moveSection(A, B, C, "left")).toThrow(CatalogError);
    expect(() => service.createSticker(A, B, { code: "", name: null, sectionId: null })).toThrow(CatalogError);
    expect(repository.calls).toHaveLength(0);
  });

  it("dispatches a bulk sticker batch as a single repository call", async () => {
    const repository = new RecordingRepository();
    const created = await new CatalogService(repository).createStickers(A, B, {
      codes: ["1", "2", "3"], name: "", sectionId: "",
    });
    expect(created).toBe(3);
    expect(repository.calls).toEqual([
      { method: "createStickers", values: [A, B, { codes: ["1", "2", "3"], name: null, sectionId: null }] },
    ]);
  });

  it("rejects a bulk batch with duplicates before touching the repository", () => {
    const repository = new RecordingRepository();
    const service = new CatalogService(repository);
    expect(() => service.createStickers(A, B, { codes: ["A1", "A1"], name: null, sectionId: null }))
      .toThrow(CatalogError);
    expect(() => service.createStickers(A, B, { codes: [], name: null, sectionId: null }))
      .toThrow(CatalogError);
    expect(repository.calls).toHaveLength(0);
  });

  it("dispatches a bulk section batch and validates its names", async () => {
    const repository = new RecordingRepository();
    const service = new CatalogService(repository);
    await expect(service.createSections(A, B, ["Página 1", "Página 2"])).resolves.toBe(2);
    expect(repository.calls[0]).toEqual({
      method: "createSections", values: [A, B, ["Página 1", "Página 2"]],
    });
    expect(() => service.createSections(A, B, ["  "])).toThrow(CatalogError);
    expect(repository.calls).toHaveLength(1);
  });
});
