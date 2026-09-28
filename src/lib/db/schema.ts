import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const USER_ROLES = ["user", "admin"] as const;
export const USER_STATUSES = ["active", "banned"] as const;
export const EMAIL_OWNER_TYPES = ["self", "parent", "guardian", "other"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type EmailOwnerType = (typeof EMAIL_OWNER_TYPES)[number];

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 30 }).notNull().unique(),
    email: varchar("email", { length: 254 }).notNull().unique(),
    emailOwnerType: varchar("email_owner_type", { length: 16 })
      .$type<EmailOwnerType>()
      .notNull(),
    role: varchar("role", { length: 16 }).$type<UserRole>().notNull().default("user"),
    status: varchar("status", { length: 16 })
      .$type<UserStatus>()
      .notNull()
      .default("active"),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("users_username_length_check", sql`char_length(${table.username}) between 3 and 30`),
    check("users_username_lowercase_check", sql`${table.username} = lower(trim(${table.username}))`),
    check("users_username_format_check", sql`${table.username} ~ '^[a-z0-9_]+$'`),
    check("users_email_normalized_check", sql`${table.email} = lower(trim(${table.email}))`),
    check("users_role_check", sql`${table.role} in ('user', 'admin')`),
    check("users_status_check", sql`${table.status} in ('active', 'banned')`),
    check(
      "users_email_owner_type_check",
      sql`${table.emailOwnerType} in ('self', 'parent', 'guardian', 'other')`,
    ),
  ],
);

export const userAdminEvents = pgTable(
  "user_admin_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "restrict" }),
    actorLabel: varchar("actor_label", { length: 64 }).notNull(),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 32 }).notNull(),
    previousValue: varchar("previous_value", { length: 16 }).notNull(),
    newValue: varchar("new_value", { length: 16 }).notNull(),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "user_admin_events_action_check",
      sql`${table.action} in ('role_change', 'block', 'unblock')`,
    ),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

export const ALBUM_STATUSES = ["draft", "published"] as const;
export type AlbumStatus = (typeof ALBUM_STATUSES)[number];

export const albums = pgTable(
  "albums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    publisher: varchar("publisher", { length: 160 }),
    year: integer("year"),
    coverUrl: varchar("cover_url", { length: 2048 }),
    status: varchar("status", { length: 16 })
      .$type<AlbumStatus>()
      .notNull()
      .default("draft"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("albums_slug_format_check", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    check("albums_title_check", sql`char_length(trim(${table.title})) between 1 and 160`),
    check("albums_status_check", sql`${table.status} in ('draft', 'published')`),
    check("albums_year_check", sql`${table.year} is null or ${table.year} between 1800 and 2200`),
  ],
);

export const albumSections = pgTable(
  "album_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("album_sections_album_position_unique").on(table.albumId, table.position),
    unique("album_sections_album_id_id_unique").on(table.albumId, table.id),
    check("album_sections_name_check", sql`char_length(trim(${table.name})) between 1 and 160`),
  ],
);

export const stickers = pgTable(
  "stickers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "restrict" }),
    sectionId: uuid("section_id"),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 160 }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("stickers_album_code_unique").on(table.albumId, table.code),
    unique("stickers_album_position_unique").on(table.albumId, table.position),
    foreignKey({
      name: "stickers_album_section_fk",
      columns: [table.albumId, table.sectionId],
      foreignColumns: [albumSections.albumId, albumSections.id],
    }).onDelete("restrict"),
    check("stickers_code_check", sql`char_length(trim(${table.code})) between 1 and 64`),
  ],
);

export const albumAdminEvents = pgTable(
  "album_admin_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    albumId: uuid("album_id").notNull(),
    albumTitle: varchar("album_title", { length: 160 }).notNull(),
    action: varchar("action", { length: 32 }).notNull(),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "album_admin_events_action_check",
      sql`${table.action} in ('create', 'publish', 'unpublish', 'delete')`,
    ),
  ],
);

/**
 * A user's personal copy of an album from the catalog. The UUID identifies a
 * collection instance (its logical "ejemplar"); a future feature will let
 * collectors share that UUID without exposing account data. CASCADE/RESTRICT
 * choices below are deliberate:
 *
 * - userAlbums → users/albums use RESTRICT so a user or master album can never
 *   be deleted out from under existing collections. Master deletion is
 *   rejected in `catalog/rules.ts` when a collection references it.
 * - userAlbumStickers.userAlbumId uses CASCADE because removing the user's own
 *   collection explicitly removes its progress (a single user-driven action).
 * - userAlbumStickers.stickerId uses RESTRICT so progress is preserved when a
 *   master sticker would otherwise be deleted. Master deletion is rejected in
 *   `catalog/rules.ts` when a user row references the sticker.
 */
export const userAlbums = pgTable(
  "user_albums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "restrict" }),
    // Public sharing state lives 1:1 with the collection: it has no independent
    // lifecycle and disappears naturally when the collection is deleted. The
    // token is a 256-bit base64url secret (43 chars) generated server-side and
    // never derived from ids or catalog data.
    shareToken: varchar("share_token", { length: 43 }).unique(),
    sharingEnabled: boolean("sharing_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("user_albums_user_album_unique").on(table.userId, table.albumId),
  ],
);

export const userAlbumStickers = pgTable(
  "user_album_stickers",
  {
    userAlbumId: uuid("user_album_id")
      .notNull()
      .references(() => userAlbums.id, { onDelete: "cascade" }),
    stickerId: uuid("sticker_id")
      .notNull()
      .references(() => stickers.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userAlbumId, table.stickerId] }),
    check("user_album_stickers_quantity_check", sql`${table.quantity} >= 1`),
  ],
);
