import { describe, expect, it } from "vitest";
import {
  MAX_BULK_SECTIONS,
  MAX_BULK_STICKERS,
  CatalogError,
  buildSectionRange,
  buildStickerRange,
  parseStickerCodeList,
} from "./service";

function code(run: () => unknown) {
  try {
    run();
    return null;
  } catch (error) {
    return error instanceof CatalogError ? error.code : "unexpected";
  }
}

describe("bulk sticker range", () => {
  it("generates a plain numeric range 1..10", () => {
    expect(buildStickerRange(1, 10, "")).toEqual([
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    ]);
  });

  it("generates a prefixed range A1..A10", () => {
    const codes = buildStickerRange(1, 10, "A");
    expect(codes).toHaveLength(10);
    expect(codes[0]).toBe("A1");
    expect(codes[9]).toBe("A10");
  });

  it("trims the prefix and supports a single-element range", () => {
    expect(buildStickerRange(5, 5, " ESP- ")).toEqual(["ESP-5"]);
  });

  it("rejects invalid ranges", () => {
    expect(code(() => buildStickerRange(10, 1, ""))).toBe("invalid_range");
    expect(code(() => buildStickerRange(-1, 5, ""))).toBe("invalid_range");
    expect(code(() => buildStickerRange("a", 5, ""))).toBe("invalid_range");
    expect(code(() => buildStickerRange(1.5, 5, ""))).toBe("invalid_range");
  });

  it("enforces the per-operation limit", () => {
    expect(buildStickerRange(1, MAX_BULK_STICKERS, "")).toHaveLength(MAX_BULK_STICKERS);
    expect(code(() => buildStickerRange(1, MAX_BULK_STICKERS + 1, ""))).toBe("bulk_limit_exceeded");
  });
});

describe("bulk sticker code list", () => {
  it("normalizes lines, trimming spaces and ignoring blanks", () => {
    expect(parseStickerCodeList("  A1 \n\n A2\n   \nESP-01\n")).toEqual([
      "A1", "A2", "ESP-01",
    ]);
  });

  it("supports CRLF input", () => {
    expect(parseStickerCodeList("1\r\n2\r\n3")).toEqual(["1", "2", "3"]);
  });

  it("detects duplicates inside the same submission", () => {
    expect(code(() => parseStickerCodeList("A1\nA1"))).toBe("duplicate_in_input");
  });

  it("rejects empty input and non-string values", () => {
    expect(code(() => parseStickerCodeList("   \n  "))).toBe("invalid_input");
    expect(code(() => parseStickerCodeList(null))).toBe("invalid_input");
  });

  it("enforces the per-operation limit", () => {
    const many = Array.from({ length: MAX_BULK_STICKERS + 1 }, (_, i) => `S${i}`).join("\n");
    expect(code(() => parseStickerCodeList(many))).toBe("bulk_limit_exceeded");
  });
});

describe("bulk section range", () => {
  it("builds numbered section names from a base label", () => {
    const names = buildSectionRange("Página", 1, 20);
    expect(names).toHaveLength(20);
    expect(names[0]).toBe("Página 1");
    expect(names[19]).toBe("Página 20");
  });

  it("rejects an empty base, invalid ranges and oversized batches", () => {
    expect(code(() => buildSectionRange("  ", 1, 3))).toBe("invalid_input");
    expect(code(() => buildSectionRange("Página", 5, 1))).toBe("invalid_range");
    expect(code(() => buildSectionRange("Página", 1, MAX_BULK_SECTIONS + 1))).toBe("bulk_limit_exceeded");
  });
});
