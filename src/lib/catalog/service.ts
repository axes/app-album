import { z } from "zod";
import type { AlbumStatus } from "@/lib/db/schema";

export type AlbumInput = {
  title: string;
  description: string | null;
  publisher: string | null;
  year: number | null;
  coverUrl: string | null;
};

export type AlbumSummary = AlbumInput & {
  id: string;
  slug: string;
  status: AlbumStatus;
  sectionCount: number;
  stickerCount: number;
  /**
   * Number of distinct users that have added this album to their collection.
   * Independent from progress: it counts `user_albums` rows for the album,
   * not completed albums, sticker quantities, visits or shares.
   */
  collectionCount: number;
};

export type AlbumSection = {
  id: string;
  albumId: string;
  name: string;
  position: number;
};

export type Sticker = {
  id: string;
  albumId: string;
  sectionId: string | null;
  code: string;
  name: string | null;
  position: number;
};

export type AlbumDetail = AlbumSummary & {
  sections: AlbumSection[];
  stickers: Sticker[];
};

export type Direction = "up" | "down";

export const MAX_BULK_STICKERS = 300;
export const MAX_BULK_SECTIONS = 100;

export type StickerBulkInput = {
  codes: string[];
  name: string | null;
  sectionId: string | null;
};

export interface CatalogRepository {
  listAlbums(): Promise<AlbumSummary[]>;
  getAlbum(id: string): Promise<AlbumDetail | null>;
  createAlbum(actorId: string, input: AlbumInput, slugBase: string): Promise<string>;
  updateAlbum(actorId: string, albumId: string, input: AlbumInput): Promise<void>;
  changeAlbumStatus(actorId: string, albumId: string, status: AlbumStatus): Promise<void>;
  deleteAlbum(actorId: string, albumId: string): Promise<void>;
  createSection(actorId: string, albumId: string, name: string): Promise<void>;
  renameSection(actorId: string, albumId: string, sectionId: string, name: string): Promise<void>;
  moveSection(actorId: string, albumId: string, sectionId: string, direction: Direction): Promise<void>;
  deleteSection(actorId: string, albumId: string, sectionId: string): Promise<void>;
  createSticker(
    actorId: string,
    albumId: string,
    input: { code: string; name: string | null; sectionId: string | null },
  ): Promise<void>;
  createStickers(actorId: string, albumId: string, input: StickerBulkInput): Promise<number>;
  createSections(actorId: string, albumId: string, names: string[]): Promise<number>;
  updateSticker(
    actorId: string,
    albumId: string,
    stickerId: string,
    input: { code: string; name: string | null; sectionId: string | null },
  ): Promise<void>;
  moveSticker(actorId: string, albumId: string, stickerId: string, direction: Direction): Promise<void>;
  deleteSticker(actorId: string, albumId: string, stickerId: string): Promise<void>;
  /**
   * Reassigns each of `stickerIds` to `sectionId` (or null = "Sin página asignada")
   * atomically. Every sticker must belong to the album; the section, if set,
   * must also belong to that album. Returns the number of updated stickers.
   * Aborts without partial mutations if any id is invalid.
   */
  bulkAssignStickerSection(
    actorId: string,
    albumId: string,
    stickerIds: string[],
    sectionId: string | null,
  ): Promise<number>;
  /**
   * Deletes each sticker of `stickerIds` atomically. Refuses the entire batch
   * if ANY sticker has progress in `user_album_stickers`, belongs to a
   * different album, or does not exist. Returns the number of deleted rows.
   */
  bulkDeleteStickers(
    actorId: string,
    albumId: string,
    stickerIds: string[],
  ): Promise<number>;
}

export type CatalogErrorCode =
  | "invalid_input"
  | "forbidden"
  | "not_found"
  | "duplicate_code"
  | "invalid_section"
  | "publication_incomplete"
  | "published_delete"
  | "album_not_empty"
  | "bulk_limit_exceeded"
  | "duplicate_in_input"
  | "invalid_range"
  | "album_has_collections"
  | "sticker_has_progress";

export class CatalogError extends Error {
  constructor(public readonly code: CatalogErrorCode) {
    super(code);
    this.name = "CatalogError";
  }
}

const uuid = z.string().uuid();
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable(),
  );
const albumInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: optionalText(5000),
  publisher: optionalText(160),
  year: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
    z.number().int().min(1800).max(2200).nullable(),
  ),
  coverUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().url().max(2048).nullable(),
  ),
});
const sectionName = z.string().trim().min(1).max(160);
const stickerSchema = z.object({
  code: z.string().trim().min(1).max(64),
  name: optionalText(160),
  sectionId: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    z.string().uuid().nullable(),
  ),
});
const directionSchema = z.enum(["up", "down"]);

export function slugifyTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
  return slug || "album";
}

function parseId(value: unknown): string {
  const parsed = uuid.safeParse(value);
  if (!parsed.success) throw new CatalogError("invalid_input");
  return parsed.data;
}

/**
 * Builds `prefix + number` codes for an inclusive numeric range.
 * The range is validated before any persistence so a bad request can never
 * create a partial batch.
 */
export function buildStickerRange(
  start: unknown,
  end: unknown,
  prefix: unknown,
  limit = MAX_BULK_STICKERS,
): string[] {
  const from = Number(start);
  const to = Number(end);
  const rawPrefix = typeof prefix === "string" ? prefix.trim() : "";
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    throw new CatalogError("invalid_range");
  }
  if (from < 0 || to < from) throw new CatalogError("invalid_range");
  const total = to - from + 1;
  if (total > limit) throw new CatalogError("bulk_limit_exceeded");
  const codes: string[] = [];
  for (let value = from; value <= to; value += 1) {
    const code = `${rawPrefix}${value}`.trim();
    if (!code || code.length > 64) throw new CatalogError("invalid_range");
    codes.push(code);
  }
  return codes;
}

/**
 * Normalizes a free-text list of codes: trims each line, drops blanks and
 * rejects duplicates inside the same submission.
 */
export function parseStickerCodeList(
  raw: unknown,
  limit = MAX_BULK_STICKERS,
): string[] {
  if (typeof raw !== "string") throw new CatalogError("invalid_input");
  const codes = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (codes.length === 0) throw new CatalogError("invalid_input");
  if (codes.length > limit) throw new CatalogError("bulk_limit_exceeded");
  const seen = new Set<string>();
  for (const code of codes) {
    if (code.length > 64) throw new CatalogError("invalid_input");
    if (seen.has(code)) throw new CatalogError("duplicate_in_input");
    seen.add(code);
  }
  return codes;
}

/**
 * Builds `base + " " + number` section names for an inclusive numeric range.
 */
export function buildSectionRange(
  base: unknown,
  start: unknown,
  end: unknown,
  limit = MAX_BULK_SECTIONS,
): string[] {
  const label = typeof base === "string" ? base.trim() : "";
  if (!label || label.length > 150) throw new CatalogError("invalid_input");
  const from = Number(start);
  const to = Number(end);
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    throw new CatalogError("invalid_range");
  }
  if (from < 0 || to < from) throw new CatalogError("invalid_range");
  const total = to - from + 1;
  if (total > limit) throw new CatalogError("bulk_limit_exceeded");
  const names: string[] = [];
  for (let value = from; value <= to; value += 1) {
    const name = `${label} ${value}`.trim();
    if (name.length > 160) throw new CatalogError("invalid_input");
    names.push(name);
  }
  return names;
}

function parseAlbumInput(value: unknown): AlbumInput {
  const parsed = albumInputSchema.safeParse(value);
  if (!parsed.success) throw new CatalogError("invalid_input");
  return parsed.data;
}

export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  listAlbums() { return this.repository.listAlbums(); }
  getAlbum(id: unknown) { return this.repository.getAlbum(parseId(id)); }

  async createAlbum(actorId: unknown, input: unknown) {
    const actor = parseId(actorId);
    const album = parseAlbumInput(input);
    return this.repository.createAlbum(actor, album, slugifyTitle(album.title));
  }

  updateAlbum(actorId: unknown, albumId: unknown, input: unknown) {
    return this.repository.updateAlbum(parseId(actorId), parseId(albumId), parseAlbumInput(input));
  }

  changeStatus(actorId: unknown, albumId: unknown, status: unknown) {
    const parsed = z.enum(["draft", "published"]).safeParse(status);
    if (!parsed.success) throw new CatalogError("invalid_input");
    return this.repository.changeAlbumStatus(parseId(actorId), parseId(albumId), parsed.data);
  }

  deleteAlbum(actorId: unknown, albumId: unknown) {
    return this.repository.deleteAlbum(parseId(actorId), parseId(albumId));
  }

  createSection(actorId: unknown, albumId: unknown, name: unknown) {
    const parsed = sectionName.safeParse(name);
    if (!parsed.success) throw new CatalogError("invalid_input");
    return this.repository.createSection(parseId(actorId), parseId(albumId), parsed.data);
  }

  renameSection(actorId: unknown, albumId: unknown, sectionId: unknown, name: unknown) {
    const parsed = sectionName.safeParse(name);
    if (!parsed.success) throw new CatalogError("invalid_input");
    return this.repository.renameSection(
      parseId(actorId), parseId(albumId), parseId(sectionId), parsed.data,
    );
  }

  moveSection(actorId: unknown, albumId: unknown, sectionId: unknown, direction: unknown) {
    const parsed = directionSchema.safeParse(direction);
    if (!parsed.success) throw new CatalogError("invalid_input");
    return this.repository.moveSection(
      parseId(actorId), parseId(albumId), parseId(sectionId), parsed.data,
    );
  }

  deleteSection(actorId: unknown, albumId: unknown, sectionId: unknown) {
    return this.repository.deleteSection(parseId(actorId), parseId(albumId), parseId(sectionId));
  }

  createSticker(actorId: unknown, albumId: unknown, input: unknown) {
    const parsed = stickerSchema.safeParse(input);
    if (!parsed.success) throw new CatalogError("invalid_input");
    return this.repository.createSticker(parseId(actorId), parseId(albumId), parsed.data);
  }

  createStickers(actorId: unknown, albumId: unknown, input: unknown) {
    const parsed = z
      .object({
        codes: z.array(z.string().trim().min(1).max(64)).min(1).max(MAX_BULK_STICKERS),
        name: optionalText(160),
        sectionId: z.preprocess(
          (value) => (value === "" || value === null || value === undefined ? null : value),
          z.string().uuid().nullable(),
        ),
      })
      .safeParse(input);
    if (!parsed.success) throw new CatalogError("invalid_input");
    const seen = new Set<string>();
    for (const code of parsed.data.codes) {
      if (seen.has(code)) throw new CatalogError("duplicate_in_input");
      seen.add(code);
    }
    return this.repository.createStickers(parseId(actorId), parseId(albumId), parsed.data);
  }

  createSections(actorId: unknown, albumId: unknown, names: unknown) {
    const parsed = z
      .array(z.string().trim().min(1).max(160))
      .min(1)
      .max(MAX_BULK_SECTIONS)
      .safeParse(names);
    if (!parsed.success) throw new CatalogError("invalid_input");
    return this.repository.createSections(parseId(actorId), parseId(albumId), parsed.data);
  }

  updateSticker(actorId: unknown, albumId: unknown, stickerId: unknown, input: unknown) {
    const parsed = stickerSchema.safeParse(input);
    if (!parsed.success) throw new CatalogError("invalid_input");
    return this.repository.updateSticker(
      parseId(actorId), parseId(albumId), parseId(stickerId), parsed.data,
    );
  }

  moveSticker(actorId: unknown, albumId: unknown, stickerId: unknown, direction: unknown) {
    const parsed = directionSchema.safeParse(direction);
    if (!parsed.success) throw new CatalogError("invalid_input");
    return this.repository.moveSticker(
      parseId(actorId), parseId(albumId), parseId(stickerId), parsed.data,
    );
  }

  deleteSticker(actorId: unknown, albumId: unknown, stickerId: unknown) {
    return this.repository.deleteSticker(parseId(actorId), parseId(albumId), parseId(stickerId));
  }

  bulkAssignStickerSection(
    actorId: unknown,
    albumId: unknown,
    stickerIds: unknown,
    sectionId: unknown,
  ) {
    const actor = parseId(actorId);
    const album = parseId(albumId);
    const parsedIds = z
      .array(z.string().uuid())
      .min(1)
      .max(MAX_BULK_STICKERS)
      .safeParse(stickerIds);
    if (!parsedIds.success) throw new CatalogError("invalid_input");
    const dedup = new Set(parsedIds.data);
    if (dedup.size !== parsedIds.data.length) {
      throw new CatalogError("duplicate_in_input");
    }
    const parsedSection = z.preprocess(
      (value) => (value === "" || value === null || value === undefined ? null : value),
      z.string().uuid().nullable(),
    ).safeParse(sectionId);
    if (!parsedSection.success) throw new CatalogError("invalid_input");
    return this.repository.bulkAssignStickerSection(actor, album, parsedIds.data, parsedSection.data);
  }

  bulkDeleteStickers(actorId: unknown, albumId: unknown, stickerIds: unknown) {
    const actor = parseId(actorId);
    const album = parseId(albumId);
    const parsedIds = z
      .array(z.string().uuid())
      .min(1)
      .max(MAX_BULK_STICKERS)
      .safeParse(stickerIds);
    if (!parsedIds.success) throw new CatalogError("invalid_input");
    const dedup = new Set(parsedIds.data);
    if (dedup.size !== parsedIds.data.length) {
      throw new CatalogError("duplicate_in_input");
    }
    return this.repository.bulkDeleteStickers(actor, album, parsedIds.data);
  }
}

export async function resolveUniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  let candidate = base;
  for (let suffix = 2; await exists(candidate); suffix += 1) {
    candidate = `${base.slice(0, 110)}-${suffix}`;
  }
  return candidate;
}
