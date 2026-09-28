import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { AlbumStatus } from "@/lib/db/schema";

/**
 * A row in `user_albums`. The UUID identifies the collector's own copy and
 * will be reused by `/app/albums/[id]` and a future public-share token.
 */
export type UserAlbum = {
  id: string;
  userId: string;
  albumId: string;
  shareToken: string | null;
  sharingEnabled: boolean;
  createdAt: Date;
};

/**
 * Minimal catalog metadata for the collector's views. Avoids serialising the
 * full `AlbumDetail` when only header information is needed.
 */
export type AlbumHeader = {
  id: string;
  title: string;
  publisher: string | null;
  year: number | null;
  coverUrl: string | null;
  status: AlbumStatus;
};

export type UserAlbumListing = UserAlbum & {
  album: AlbumHeader;
  progress: Progress;
};

export type PublishedAlbumListing = AlbumHeader & {
  stickerCount: number;
  userAlbumId: string | null;
};

/**
 * Public sharing state of a collection. `token` is only meaningful while
 * `enabled` is true; a disabled collection keeps its token so reactivating
 * reuses the same link.
 */
export type ShareState = {
  enabled: boolean;
  token: string | null;
};

export type UserAlbumDetail = UserAlbumListing & {
  sharing: ShareState;
  sections: Array<{
    id: string;
    name: string;
    position: number;
    stickers: Array<{
      id: string;
      code: string;
      name: string | null;
      position: number;
      quantity: number;
    }>;
  }>;
  unassigned: Array<{
    id: string;
    code: string;
    name: string | null;
    position: number;
    quantity: number;
  }>;
};

export type Progress = {
  total: number;
  owned: number;
  missing: number;
  duplicates: number;
  percentage: number;
};

/**
 * Public, read-only projection of a shared collection. It deliberately omits
 * every internal identifier (user, collection, album, page and sticker ids) and
 * all account data; only catalog metadata, progress and the derived missing /
 * duplicate lists are exposed.
 */
export type PublicSticker = { code: string; name: string | null };
export type PublicDuplicate = PublicSticker & { duplicates: number };
export type PublicGroup<T> = { name: string; stickers: T[] };

export type PublicAlbumView = {
  album: {
    title: string;
    publisher: string | null;
    year: number | null;
    coverUrl: string | null;
  };
  progress: Progress;
  missing: PublicGroup<PublicSticker>[];
  duplicates: PublicGroup<PublicDuplicate>[];
};

export type EnableSharingResult =
  | { status: "enabled"; token: string }
  | { status: "collision" };

export type StickerQuantityChange = "increment" | "decrement" | "set";

export type SetQuantityInput = { change: StickerQuantityChange; quantity?: number };

export type CollectionErrorCode =
  | "invalid_input"
  | "forbidden"
  | "not_found"
  | "album_not_published"
  | "sticker_not_in_album"
  | "duplicate_collection"
  | "album_has_collections"
  | "sticker_has_progress"
  | "share_token_collision";

export class CollectionError extends Error {
  constructor(public readonly code: CollectionErrorCode) {
    super(code);
    this.name = "CollectionError";
  }
}

export interface CollectionRepository {
  // Collection lifecycle
  addAlbum(actorId: string, albumId: string): Promise<UserAlbum>;
  getAlbumForOwner(userId: string, userAlbumId: string): Promise<UserAlbum | null>;
  listAlbumsForOwner(userId: string): Promise<UserAlbum[]>;
  listPublishedAlbums(userId: string): Promise<PublishedAlbumListing[]>;
  removeAlbum(actorId: string, userAlbumId: string): Promise<void>;

  // Catalog context (used to build listings/details efficiently).
  // Returns null when the master album no longer exists.
  findAlbumHeader(albumId: string): Promise<AlbumHeader | null>;

  // Sticker quantities
  listAlbumsByOwnerWithProgress(userId: string): Promise<UserAlbumListing[]>;
  getAlbumDetail(userId: string, userAlbumId: string): Promise<UserAlbumDetail | null>;
  listQuantities(userId: string, userAlbumId: string): Promise<Map<string, number>>;
  adjustQuantity(actorId: string, userAlbumId: string, stickerId: string, change: StickerQuantityChange, quantity?: number): Promise<void>;

  // Public sharing. `enableSharing` verifies ownership, reuses an existing
  // token when present and otherwise persists `candidateToken`; it reports a
  // collision only for the `share_token` unique constraint.
  enableSharing(actorId: string, userAlbumId: string, candidateToken: string): Promise<EnableSharingResult>;
  disableSharing(actorId: string, userAlbumId: string): Promise<void>;
  getPublicAlbumByToken(token: string): Promise<PublicAlbumView | null>;

  // Master-protection helpers used by the catalog admin layer.
  albumHasCollections(albumId: string): Promise<boolean>;
  stickerHasProgress(stickerId: string): Promise<boolean>;
}

const uuid = z.string().uuid();

function parseId(value: unknown, code: CollectionErrorCode = "invalid_input"): string {
  const parsed = uuid.safeParse(value);
  if (!parsed.success) throw new CollectionError(code);
  return parsed.data;
}
const changeSchema = z.enum(["increment", "decrement", "set"]);
const setInputSchema = z
  .object({
    change: changeSchema,
    quantity: z.number().int().min(0).max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.change === "set" && typeof value.quantity !== "number") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "missing quantity" });
    }
    if (value.change !== "set" && typeof value.quantity === "number") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "extra quantity" });
    }
  })
  .transform((value) => ({ change: value.change, quantity: value.quantity }));

function parseChange(value: unknown): SetQuantityInput {
  const parsed = setInputSchema.safeParse(value);
  if (!parsed.success) throw new CollectionError("invalid_input");
  return parsed.data;
}

/**
 * A share token is 32 random bytes encoded as base64url: 256 bits of entropy,
 * 43 URL-safe characters, never derived from ids or catalog data.
 */
export const SHARE_TOKEN_LENGTH = 43;
const shareTokenSchema = z
  .string()
  .length(SHARE_TOKEN_LENGTH)
  .regex(/^[A-Za-z0-9_-]+$/);

export function generateShareToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isValidShareToken(value: unknown): value is string {
  return shareTokenSchema.safeParse(value).success;
}

/** Maximum number of token candidates tried before giving up on a collision. */
export const SHARE_TOKEN_MAX_ATTEMPTS = 5;

export class CollectionService {
  constructor(private readonly repository: CollectionRepository) {}

  addAlbum(actorId: unknown, albumId: unknown) {
    // Both ids must be valid before anything touches the DB: a malformed actor
    // id is treated as forbidden (the identity is suspect), while a malformed
    // album id is invalid_input (the reference itself is malformed).
    const actor = parseId(actorId, "forbidden");
    const album = parseId(albumId, "invalid_input");
    return this.repository.addAlbum(actor, album);
  }

  async getAlbumForOwner(userId: unknown, userAlbumId: unknown): Promise<UserAlbum> {
    const user = parseId(userId, "forbidden");
    const id = parseId(userAlbumId);
    const row = await this.repository.getAlbumForOwner(user, id);
    if (!row) throw new CollectionError("not_found");
    return row;
  }

  listAlbumsForOwner(userId: unknown) {
    return this.repository.listAlbumsByOwnerWithProgress(parseId(userId, "forbidden"));
  }

  listPublishedAlbums(userId: unknown) {
    return this.repository.listPublishedAlbums(parseId(userId, "forbidden"));
  }

  async getAlbumDetail(userId: unknown, userAlbumId: unknown): Promise<UserAlbumDetail> {
    const user = parseId(userId, "forbidden");
    const id = parseId(userAlbumId);
    const detail = await this.repository.getAlbumDetail(user, id);
    if (!detail) throw new CollectionError("not_found");
    return detail;
  }

  removeAlbum(actorId: unknown, userAlbumId: unknown) {
    return this.repository.removeAlbum(parseId(actorId, "forbidden"), parseId(userAlbumId));
  }

  listQuantities(userId: unknown, userAlbumId: unknown) {
    return this.repository.listQuantities(
      parseId(userId, "forbidden"),
      parseId(userAlbumId),
    );
  }

  albumHasCollections(albumId: unknown) {
    return this.repository.albumHasCollections(parseId(albumId));
  }

  stickerHasProgress(stickerId: unknown) {
    return this.repository.stickerHasProgress(parseId(stickerId));
  }

  adjustQuantity(
    actorId: unknown,
    userAlbumId: unknown,
    stickerId: unknown,
    input: unknown,
  ) {
    const parsed = parseChange(input);
    return this.repository.adjustQuantity(
      parseId(actorId, "forbidden"),
      parseId(userAlbumId),
      parseId(stickerId),
      parsed.change,
      parsed.quantity,
    );
  }

  // Pure helpers exposed for callers/tests without touching the repository.
  computeProgress(quantities: Iterable<number>, total: number): Progress {
    return computeProgress(quantities, total);
  }

  /**
   * Enables public sharing for a collection owned by `actorId`. The token is
   * generated server-side and retried on unique collisions up to
   * `SHARE_TOKEN_MAX_ATTEMPTS`; exhausting the budget surfaces a controlled
   * `share_token_collision` error instead of looping forever.
   */
  async enableSharing(actorId: unknown, userAlbumId: unknown): Promise<{ token: string }> {
    const actor = parseId(actorId, "forbidden");
    const id = parseId(userAlbumId);
    for (let attempt = 0; attempt < SHARE_TOKEN_MAX_ATTEMPTS; attempt += 1) {
      const result = await this.repository.enableSharing(actor, id, generateShareToken());
      if (result.status === "enabled") return { token: result.token };
    }
    throw new CollectionError("share_token_collision");
  }

  disableSharing(actorId: unknown, userAlbumId: unknown) {
    return this.repository.disableSharing(parseId(actorId, "forbidden"), parseId(userAlbumId));
  }

  /**
   * Public lookup by token. A malformed token is treated exactly like an
   * unknown one (null) so callers can render an indistinguishable 404.
   */
  getPublicAlbumByToken(token: unknown): Promise<PublicAlbumView | null> {
    if (!isValidShareToken(token)) return Promise.resolve(null);
    return this.repository.getPublicAlbumByToken(token);
  }
}

/**
 * Pure progress math: derives owned/missing/duplicates/percentage from a
 * quantity iterable. Zero quantities are not persisted (the absence of a row
 * represents 0) so `quantities` only contains values >= 1.
 */
export function computeProgress(quantities: Iterable<number>, total: number): Progress {
  let owned = 0;
  let duplicates = 0;
  for (const value of quantities) {
    if (value < 1) continue;
    owned += 1;
    if (value > 1) duplicates += value - 1;
  }
  const safeTotal = Math.max(0, Math.floor(total));
  const missing = Math.max(0, safeTotal - owned);
  const percentage = safeTotal === 0 ? 0 : Math.round((owned / safeTotal) * 100);
  return { total: safeTotal, owned, missing, duplicates, percentage };
}
