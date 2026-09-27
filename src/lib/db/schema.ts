import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  timestamp,
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
