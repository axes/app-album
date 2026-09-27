import { describe, expect, it } from "vitest";
import { CatalogError } from "./service";
import {
  assertCanDeleteAlbum,
  assertCanPublish,
  assertPageDeletionKeepsStickers,
  assertSectionBelongsToAlbum,
  assertStickerCodeAvailable,
  auditActionForStatus,
} from "./rules";

function code(run: () => void) { try { run(); return null; } catch (error) { return error instanceof CatalogError ? error.code : "unexpected"; } }

describe("catalog integrity rules", () => {
  it("requires title and at least one sticker; pages are optional", () => {
    // Happy paths
    expect(() => assertCanPublish("Album", 0, 1)).not.toThrow();
    expect(() => assertCanPublish("Album", 24, 240)).not.toThrow();
    // Failure modes
    expect(code(() => assertCanPublish("", 24, 240))).toBe("publication_incomplete");
    expect(code(() => assertCanPublish("Album", 0, 0))).toBe("publication_incomplete");
    expect(code(() => assertCanPublish("Album", 24, 0))).toBe("publication_incomplete");
  });
  it("allows deletion only for an empty draft", () => {
    expect(() => assertCanDeleteAlbum("draft", 0, 0)).not.toThrow();
    expect(code(() => assertCanDeleteAlbum("published", 0, 0))).toBe("published_delete");
    expect(code(() => assertCanDeleteAlbum("draft", 1, 0))).toBe("album_not_empty");
  });
  it("scopes duplicate sticker codes to one album", () => {
    const existing = [{ albumId: "album-a", code: "A1" }];
    expect(code(() => assertStickerCodeAvailable(existing, "album-a", "A1"))).toBe("duplicate_code");
    expect(() => assertStickerCodeAvailable(existing, "album-b", "A1")).not.toThrow();
  });
  it("maps publication transitions to their audit actions", () => {
    expect(auditActionForStatus("published")).toBe("publish");
    expect(auditActionForStatus("draft")).toBe("unpublish");
  });
  it("rejects sections from another album", () => {
    expect(() => assertSectionBelongsToAlbum("album-a", "album-a")).not.toThrow();
    expect(code(() => assertSectionBelongsToAlbum("album-b", "album-a"))).toBe("invalid_section");
  });

  it("never blocks page deletion because of assigned stickers", () => {
    // Deleting a page detaches its stickers instead of refusing the operation.
    expect(() => assertPageDeletionKeepsStickers(0)).not.toThrow();
    expect(() => assertPageDeletionKeepsStickers(1)).not.toThrow();
    expect(() => assertPageDeletionKeepsStickers(250)).not.toThrow();
    expect(code(() => assertPageDeletionKeepsStickers(-1))).toBe("invalid_input");
  });
});
