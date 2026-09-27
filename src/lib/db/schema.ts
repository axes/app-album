import { sql } from "drizzle-orm";
import { check, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 30 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Defensive checks: the server is the authority, but the database must
    // reject malformed usernames even if a future code path forgets to
    // normalize. Usernames are stored already trimmed and lowercased.
    check(
      "users_username_length_check",
      sql`char_length(${table.username}) between 3 and 30`,
    ),
    check(
      "users_username_lowercase_check",
      sql`${table.username} = lower(trim(${table.username}))`,
    ),
    check(
      "users_username_format_check",
      sql`${table.username} ~ '^[a-z0-9_]+$'`,
    ),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
